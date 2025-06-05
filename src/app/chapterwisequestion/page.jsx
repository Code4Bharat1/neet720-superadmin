"use client";

import React, { useState } from "react";

const Page = () => {
  const [pdfForm, setPdfForm] = useState({
    chapterName: "",
    subject: "",
    topicTags: "",
  });
  const [pdfId, setPdfId] = useState(null);

  const [questionForm, setQuestionForm] = useState({
    pdfId: "",
    topicId: "",
    question: "",
    difficulty_level: "medium",
    options: [
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
    ],
    solution: "",
    diagramPath: "",
  });

  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Create PDF and set ID
  const handleCreatePdf = async () => {
    // Simulated API call for demo - replace with actual axios implementation
    try {
      const mockPdfId = Math.random().toString(36).substr(2, 9);
      setPdfId(mockPdfId);
      setQuestionForm((prev) => ({ ...prev, pdfId: mockPdfId }));
      alert("PDF Created. PDF ID: " + mockPdfId);
    } catch (error) {
      console.error("PDF creation failed:", error);
      alert("Error creating PDF");
    }
  };

  // Upload Diagram Image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulated upload for demo - replace with actual axios implementation
    try {
      setUploading(true);
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockImageUrl = URL.createObjectURL(file);
      setQuestionForm((prev) => ({ ...prev, diagramPath: mockImageUrl }));
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Evaluate Difficulty
  const handleEvaluateDifficulty = async () => {
    const mcqText = `${questionForm.question}\n` + questionForm.options
      .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt.option_text}`)
      .join("\n");

    try {
      setEvaluating(true);
      // Simulate API call for demo - replace with actual axios implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const difficulties = ["simple", "medium", "hard"];
      const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

      setQuestionForm((prev) => ({
        ...prev,
        difficulty_level: randomDifficulty,
      }));
      
      alert(`Difficulty evaluated as: ${randomDifficulty}`);
    } catch (error) {
      console.error("Difficulty evaluation failed:", error);
      alert("Failed to evaluate difficulty.");
    } finally {
      setEvaluating(false);
    }
  };

  // Submit full question
  const handleCreateQuestion = async () => {
    try {
      // Simulated API call for demo - replace with actual axios implementation
      const mockQuestionId = Math.random().toString(36).substr(2, 9);
      alert("Question created successfully. ID: " + mockQuestionId);
    } catch (error) {
      console.error("Question creation failed:", error);
      alert("Error creating question");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block p-1 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            <div className="bg-white rounded-xl px-8 py-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Chapter-wise Question Entry
              </h1>
            </div>
          </div>
          <p className="text-gray-600 text-lg">Create and manage educational content with ease</p>
        </div>

        <div className="space-y-8">
          {/* PDF Form */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-1 rounded-2xl shadow-xl">
            <div className="bg-white rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Create PDF Entry</h2>
              </div>
              
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Chapter Name</label>
                  <input
                    placeholder="Enter chapter name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={pdfForm.chapterName}
                    onChange={(e) => setPdfForm({ ...pdfForm, chapterName: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <input
                    placeholder="Enter subject"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={pdfForm.subject}
                    onChange={(e) => setPdfForm({ ...pdfForm, subject: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Topic Tags</label>
                  <input
                    placeholder="Enter topic tags (comma-separated)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={pdfForm.topicTags}
                    onChange={(e) => setPdfForm({ ...pdfForm, topicTags: e.target.value })}
                  />
                </div>
                
                <button
                  onClick={handleCreatePdf}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get PDF ID
                </button>
              </div>
            </div>
          </div>

          {/* Question Form */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-1 rounded-2xl shadow-xl">
            <div className="bg-white rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Create Question</h2>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">PDF ID</label>
                  <input
                    placeholder="Enter PDF ID"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={questionForm.pdfId}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, pdfId: e.target.value })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Question Text</label>
                  <textarea
                    placeholder="Enter your question here..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    value={questionForm.question}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, question: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
                    Answer Options
                  </h3>
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white font-medium text-sm">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <input
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                          value={opt.option_text}
                          onChange={(e) => {
                            const updated = [...questionForm.options];
                            updated[idx].option_text = e.target.value;
                            setQuestionForm({ ...questionForm, options: updated });
                          }}
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={opt.is_correct}
                            onChange={(e) => {
                              const updated = [...questionForm.options];
                              updated[idx].is_correct = e.target.checked;
                              setQuestionForm({ ...questionForm, options: updated });
                            }}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Correct</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleEvaluateDifficulty}
                    disabled={evaluating}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none disabled:shadow-md"
                  >
                    {evaluating ? "Evaluating..." : "✨ Evaluate Difficulty"}
                  </button>
                  
                  <select
                    value={questionForm.difficulty_level}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, difficulty_level: e.target.value })
                    }
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="simple">🟢 Simple</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="hard">🔴 Hard</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Solution</label>
                  <textarea
                    placeholder="Provide detailed solution..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    value={questionForm.solution}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, solution: e.target.value })
                    }
                  />
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-100 p-6 rounded-xl border border-yellow-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                    Upload Diagram
                  </h3>
                  
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-orange-400 file:to-pink-500 file:text-white hover:file:from-orange-500 hover:file:to-pink-600 file:cursor-pointer file:transition-all file:duration-200"
                    />
                    
                    {uploading && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Uploading image...</span>
                      </div>
                    )}

                    <input
                      placeholder="Or paste diagram URL here..."
                      className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 bg-white"
                      value={questionForm.diagramPath}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, diagramPath: e.target.value })
                      }
                    />

                    {questionForm.diagramPath && (
                      <div className="bg-white p-4 rounded-xl border border-orange-200">
                        <img
                          src={questionForm.diagramPath}
                          alt="Uploaded diagram"
                          className="max-w-sm rounded-lg shadow-md border border-gray-200"
                        />
                        <p className="text-xs text-gray-500 mt-2 break-all bg-gray-50 p-2 rounded">{questionForm.diagramPath}</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCreateQuestion}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg"
                >
                  🚀 Submit Question
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;