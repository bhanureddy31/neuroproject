import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    // Receive multipart/form-data from the frontend.
    const formData = await req.formData();

    const mriFile = formData.get('mriFile');
    const patientDataRaw = formData.get('patientData');
    const modeRaw = formData.get('mode');

    const mode =
      modeRaw === 'alzheimer' ||
      modeRaw === 'parkinson' ||
      modeRaw === 'dual'
        ? modeRaw
        : null;

    if (!mode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing MRI analysis mode. Supported modes are: alzheimer, parkinson, dual.',
        },
        { status: 400 }
      );
    }

    // Validate MRI upload.
    if (!(mriFile instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No MRI file was provided.',
        },
        { status: 400 }
      );
    }

    const originalName = mriFile.name.toLowerCase();
    const isNifti = originalName.endsWith('.nii') || originalName.endsWith('.nii.gz');
    const isImage =
      originalName.endsWith('.png') ||
      originalName.endsWith('.jpg') ||
      originalName.endsWith('.jpeg') ||
      originalName.endsWith('.webp');

    // Strict disease-specific format validation
    if (mode === 'parkinson' && !isNifti) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Parkinson's disease assessment requires a 3D NIfTI MRI volume (.nii or .nii.gz). 2D planar images are not supported for this volumetric pipeline.",
        },
        { status: 400 }
      );
    }

    if (mode === 'dual' && !isNifti) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Dual assessment requires a 3D NIfTI MRI volume (.nii or .nii.gz) to execute the Parkinson volumetric pipeline alongside Alzheimer assessment.",
        },
        { status: 400 }
      );
    }

    if (mode === 'alzheimer' && !isNifti && !isImage) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unsupported file format for Alzheimer assessment. Please upload a 2D MRI slice (.png, .jpg, .jpeg, .webp) or a 3D NIfTI volume (.nii, .nii.gz).',
        },
        { status: 400 }
      );
    }

    // Parse patient information.
    let patientData = null;
    if (typeof patientDataRaw === 'string') {
      try {
        patientData = JSON.parse(patientDataRaw);
      } catch {
        patientData = null;
      }
    }

    // Create temporary upload directory
    const dataDir = path.join(os.tmpdir(), 'neuro_uploads');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Directory may already exist
      }
    }

    let extension = path.extname(originalName);
    if (originalName.endsWith('.nii.gz')) {
      extension = '.nii.gz';
    } else if (!extension) {
      extension = isNifti ? '.nii' : '.png';
    }

    // Read the actual uploaded file buffer
    const fileBuffer = Buffer.from(await mriFile.arrayBuffer());

    if (fileBuffer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'The uploaded MRI file is empty (0 bytes).',
        },
        { status: 400 }
      );
    }

    tempFilePath = path.join(
      dataDir,
      `upload_${Date.now()}_${Math.random().toString(36).substring(7)}${extension}`
    );

    fs.writeFileSync(tempFilePath, fileBuffer);

    console.log('MRI file received successfully:', {
      name: mriFile.name,
      size: fileBuffer.length,
      mode,
      tempPath: tempFilePath,
    });

    // -------------------------------------------------------------
    // REMOTE INFERENCE PIPELINE (if PYTHON_INFERENCE_URL configured)
    // -------------------------------------------------------------
    if (process.env.PYTHON_INFERENCE_URL) {
      console.log('Routing inference to remote service:', process.env.PYTHON_INFERENCE_URL);
      try {
        const remoteFormData = new FormData();
        const blob = new Blob([fileBuffer], { type: mriFile.type || 'application/octet-stream' });
        remoteFormData.append('mriFile', blob, mriFile.name);
        remoteFormData.append('mode', mode);
        if (patientDataRaw) {
          remoteFormData.append('patientData', String(patientDataRaw));
        }

        const remoteRes = await fetch(process.env.PYTHON_INFERENCE_URL, {
          method: 'POST',
          body: remoteFormData,
        });

        if (!remoteRes.ok) {
          const errText = await remoteRes.text();
          return NextResponse.json(
            {
              success: false,
              error: `Remote inference service returned HTTP ${remoteRes.status}: ${errText.slice(0, 200)}`,
            },
            { status: 502 }
          );
        }

        const pyOutput = await remoteRes.json();
        if (!pyOutput.success) {
          return NextResponse.json(
            {
              success: false,
              error: pyOutput.error || 'Remote PyTorch model inference failed.',
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          mode,
          engine: pyOutput.engine || 'PyTorch Cloud Inference Engine',
          timestamp: new Date().toISOString(),
          patientData: patientData ?? null,
          inputType: pyOutput.input_type || (isNifti ? 'NIfTI' : 'Image'),
          alzheimer: pyOutput.alzheimer,
          parkinson: pyOutput.parkinson,
        });
      } catch (remoteErr: unknown) {
        const errMsg = remoteErr instanceof Error ? remoteErr.message : 'Unknown connection error';
        console.error('Remote inference connection failure:', errMsg);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to connect to remote inference service (${process.env.PYTHON_INFERENCE_URL}): ${errMsg}`,
          },
          { status: 502 }
        );
      }
    }

    // -------------------------------------------------------------
    // LOCAL PYTHON / PYTORCH EXECUTION
    // -------------------------------------------------------------
    const scriptPath = path.join(process.cwd(), 'backend', 'run_inference.py');

    const localPython =
      process.platform === 'win32'
        ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
        : path.join(process.cwd(), '.venv', 'bin', 'python');

    const pythonExecutable =
      process.env.PYTHON_EXECUTABLE ||
      (fs.existsSync(localPython) ? localPython : 'python');

    console.log('Executing local PyTorch inference:', {
      python: pythonExecutable,
      script: scriptPath,
      mode,
    });

    let pyOutput: any = null;
    let pyExecutionError: string | null = null;

    try {
      const { stdout, stderr } = await execFileAsync(pythonExecutable, [
        scriptPath,
        '--image',
        tempFilePath,
        '--mode',
        mode,
      ]);

      if (stderr) {
        console.log('Python stderr output:', stderr);
      }

      if (stdout && stdout.trim()) {
        const firstBrace = stdout.indexOf('{');
        const lastBrace = stdout.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonText = stdout.slice(firstBrace, lastBrace + 1);
          pyOutput = JSON.parse(jsonText);
        }
      }
    } catch (pyErr: unknown) {
      pyExecutionError = pyErr instanceof Error ? pyErr.message : String(pyErr);
      console.error('Local Python execution error:', pyExecutionError);
    }

    // Handle structured response from local Python script
    if (pyOutput) {
      if (pyOutput.success) {
        return NextResponse.json({
          success: true,
          mode,
          engine: pyOutput.engine || 'PyTorch EfficientNet-B0 (Trained Checkpoint)',
          timestamp: new Date().toISOString(),
          patientData: patientData ?? null,
          inputType: pyOutput.input_type || (isNifti ? 'NIfTI' : 'Image'),
          alzheimer: pyOutput.alzheimer,
          parkinson: pyOutput.parkinson,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: pyOutput.error || 'PyTorch model inference failed.',
            errorType: pyOutput.error_type,
          },
          { status: 400 }
        );
      }
    }

    // If neither local nor remote inference succeeded, RETURN STRUCTURED 503 ERROR.
    // NEVER fall back to heuristic, synthetic, or filename-based mock predictions!
    return NextResponse.json(
      {
        success: false,
        error:
          'PyTorch inference engine is currently unavailable. No local Python/PyTorch runtime was able to run, and no remote inference endpoint (PYTHON_INFERENCE_URL) is configured.',
        code: 'INFERENCE_ENGINE_UNAVAILABLE',
        details: pyExecutionError ? 'Python runtime error encountered during execution.' : undefined,
      },
      { status: 503 }
    );
  } catch (error: unknown) {
    console.error('Inference bridge error:', error);
    const message = error instanceof Error ? error.message : 'Unknown inference error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Temporary file cleanup failed:', cleanupError);
      }
    }
  }
}