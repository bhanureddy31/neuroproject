'use client';

import React from 'react';
import { Brain, Database, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-[#24333B]">
      <div>
        <h1 className="text-3xl font-bold">About NeuroDiagnosis</h1>
        <p className="text-[#78858A]">Understanding the AI models powering the platform</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDE7E1] p-8 shadow-[0_8px_24px_rgba(36,51,59,0.055)] flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-[#EEF4F0] rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className="w-12 h-12 text-[#3D8062]" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Platform Overview</h2>
          <p className="text-[#78858A] leading-relaxed">
            NeuroDiagnosis is a web application designed to assist in the analysis of neurodegenerative diseases using advanced deep learning techniques. It utilizes Convolutional Neural Networks (CNNs) to analyze MRI scans and provide probability scores for Alzheimer's and Parkinson's disease classifications.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Alzheimer's Model */}
        <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#3D8062]" /> Alzheimer's Model
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Architecture:</strong> EfficientNet-B0</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Framework:</strong> PyTorch</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Classes:</strong> NonDemented, VeryMildDemented, MildDemented, ModerateDemented</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Input:</strong> 224×224 RGB MRI</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Normalization:</strong> ImageNet standards</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Grad-CAM Layer:</strong> model.features[-1]</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Training:</strong> Experiment 10, 20 epochs, AdamW</li>
          </ul>
        </div>

        {/* Parkinson's Model */}
        <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#3D8062]" /> Parkinson's Model
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Architecture:</strong> EfficientNet-B0</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Framework:</strong> PyTorch</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Classes:</strong> Healthy Control (CO), Parkinson's Disease (PD)</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Input:</strong> 224×224 RGB MRI</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Normalization:</strong> ImageNet standards</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Grad-CAM Layer:</strong> model.features[-1]</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#3D8062] mt-0.5" /> <strong>Training:</strong> Experiment 06, 15 epochs, 177 subjects</li>
          </ul>
        </div>
      </div>

      <div className="bg-[#FFF7E6] rounded-2xl border border-[#f0e3cc] p-6 flex gap-4 items-start">
        <AlertTriangle className="w-6 h-6 text-[#A26E17] flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-[#A26E17] mb-1">Important Disclaimer</h3>
          <p className="text-sm text-[#8c5f13] leading-relaxed">
            This platform is a research prototype for educational and demonstration purposes only. It is <strong>NOT</strong> a certified medical device and must <strong>NOT</strong> be used for clinical diagnosis. All predictions should be reviewed by qualified medical professionals.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDE7E1] p-6 shadow-[0_8px_24px_rgba(36,51,59,0.055)] text-center">
        <Users className="w-8 h-8 text-[#3D8062] mx-auto mb-3" />
        <h3 className="font-bold mb-2">Team & Credits</h3>
        <p className="text-sm text-[#78858A]">
          Developed as a mini-project for demonstrating applied deep learning in healthcare.<br/>
          Contributions and research backing provided by the development team.
        </p>
      </div>
    </div>
  );
}
