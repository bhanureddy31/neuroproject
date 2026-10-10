import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

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
      error: 'Invalid or missing MRI analysis mode.',
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

    // Parse patient information.
    let patientData = null;

    if (typeof patientDataRaw === 'string') {
      try {
        patientData = JSON.parse(patientDataRaw);
      } catch {
        patientData = null;
      }
    }

    // Create temporary data directory.
    const dataDir = path.join(process.cwd(), 'data');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    /*
     * Preserve the actual uploaded MRI file type.
     *
     * Supported:
     *   .nii
     *   .nii.gz
     *   .png
     *   .jpg
     *   .jpeg
     *   .webp
     */
    const allowedExtensions = [
  '.nii',
  '.nii.gz',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
];

if (
  !allowedExtensions.some((ext) =>
    mriFile.name.toLowerCase().endsWith(ext)
  )
) {
  return NextResponse.json(
    {
      success: false,
      error: 'Unsupported file format. Use .nii, .nii.gz, .png, .jpg, .jpeg, or .webp.',
    },
    { status: 400 }
  );
}
    const originalName = mriFile.name.toLowerCase();

    let extension = path.extname(originalName);

    if (originalName.endsWith('.nii.gz')) {
      extension = '.nii.gz';
    } else if (!extension) {
      const mimeType = mriFile.type.toLowerCase();

      if (mimeType.includes('png')) {
        extension = '.png';
      } else if (
        mimeType.includes('jpeg') ||
        mimeType.includes('jpg')
      ) {
        extension = '.jpg';
      } else if (mimeType.includes('webp')) {
        extension = '.webp';
      } else if (
        mimeType.includes('gzip') ||
        mimeType.includes('x-gzip')
      ) {
        extension = '.nii.gz';
      } else {
        extension = '.nii';
      }
    }

    // Read the actual uploaded file.
    const fileBuffer = Buffer.from(
      await mriFile.arrayBuffer()
    );

    // Save temporary MRI file.
    tempFilePath = path.join(
      dataDir,
      `upload_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}${extension}`
    );

    fs.writeFileSync(
      tempFilePath,
      fileBuffer
    );

    console.log('MRI file received successfully.');
    console.log('Original filename:', mriFile.name);
    console.log('MRI type:', mriFile.type);
    console.log('Temporary file:', tempFilePath);
    console.log('File size:', fileBuffer.length, 'bytes');

    /*
     * If remote PYTHON_INFERENCE_URL is configured (e.g. Hugging Face Spaces / Render / FastAPI),
     * forward the request over HTTP.
     */
    if (process.env.PYTHON_INFERENCE_URL) {
      console.log('Sending MRI file to remote inference URL:', process.env.PYTHON_INFERENCE_URL);
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
        throw new Error(`Remote inference service error (${remoteRes.status}): ${errText}`);
      }

      const pyOutput = await remoteRes.json();
      if (!pyOutput.success) {
        throw new Error(pyOutput.error || 'Remote PyTorch inference failed.');
      }

      return NextResponse.json({
        success: true,
        mode,
        engine: pyOutput.engine || 'PyTorch Cloud Inference Engine',
        timestamp: new Date().toISOString(),
        patientData: patientData ?? null,
        inputType: pyOutput.input_type,
        alzheimer: pyOutput.alzheimer,
        parkinson: pyOutput.parkinson,
      });
    }

    /*
     * Python inference backend (Local / Docker Execution).
     */
    const scriptPath = path.join(
      process.cwd(),
      'backend',
      'run_inference.py'
    );

    /*
     * Prefer the project's local Python virtual environment.
     */
    const localPython =
      process.platform === 'win32'
        ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
        : path.join(process.cwd(), '.venv', 'bin', 'python');

    const pythonExecutable =
      process.env.PYTHON_EXECUTABLE ||
      (fs.existsSync(localPython) ? localPython : 'python');

    console.log('Running PyTorch inference locally...');
    console.log('Python:', pythonExecutable);
    console.log('Input:', tempFilePath);

    const { stdout, stderr } = await execFileAsync(
      pythonExecutable,
      [
        scriptPath,
        '--image',
        tempFilePath,
        '--mode',
        mode,
      ],
    );

    if (stderr) {
      console.log(
        'Python stderr:',
        stderr
      );
    }

    if (!stdout || !stdout.trim()) {
      throw new Error(
        'Python inference returned no output.'
      );
    }

    /*
     * Extract the JSON object returned by Python.
     */
    const firstBrace = stdout.indexOf('{');
    const lastBrace = stdout.lastIndexOf('}');

    if (
      firstBrace === -1 ||
      lastBrace === -1
    ) {
      console.error(
        'Raw Python stdout:',
        stdout
      );

      throw new Error(
        'No valid JSON output received from Python inference.'
      );
    }

    const jsonText = stdout.slice(
      firstBrace,
      lastBrace + 1
    );

    const pyOutput = JSON.parse(jsonText);

    /*
     * Never convert failed inference into
     * a fabricated prediction.
     */
    if (!pyOutput.success) {
      throw new Error(
        pyOutput.error ||
          'PyTorch inference failed.'
      );
    }

    console.log(
      'PyTorch inference completed successfully.'
    );

    /*
     * Return the actual Python model results.
     */
    return NextResponse.json({
      success: true,
      mode,
      engine: pyOutput.engine,
      timestamp: new Date().toISOString(),

      patientData: patientData ?? null,

      inputType: pyOutput.input_type,

      alzheimer: pyOutput.alzheimer,

      parkinson: pyOutput.parkinson,
    });
  } catch (error: unknown) {
    console.error(
      'Inference bridge error:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown inference error';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  } finally {
    /*
     * Remove only the temporary uploaded file.
     */
    if (
      tempFilePath &&
      fs.existsSync(tempFilePath)
    ) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error(
          'Temporary file cleanup failed:',
          cleanupError
        );
      }
    }
  }
}