"use client";

import React, { useState } from "react";
import axios from "axios";

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
    try {
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pdfid`, {
        chapterName: pdfForm.chapterName,
        subject: pdfForm.subject,
        topicTags: pdfForm.topicTags.split(",").map(tag => tag.trim()),
      });

      setPdfId(data.pdfId);
      setQuestionForm((prev) => ({ ...prev, pdfId: data.pdfId }));
      alert("PDF Created. PDF ID: " + data.pdfId);
    } catch (error) {
      console.error("PDF creation failed:", error);
      alert(error.response?.data?.message || "Error creating PDF");
    }
  };

  // Upload Diagram Image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = res.data.url;
      setQuestionForm((prev) => ({ ...prev, diagramPath: imageUrl }));
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
      const res = await axios.post(`http://localhost:5000/api/assess-difficulty`, {
        mcq: mcqText,
      });

      const difficulty = res.data.difficulty?.toLowerCase() || "medium";

// Map Gemini difficulty to backend-accepted format
const mappedDifficulty =
  difficulty === "easy" ? "simple" : difficulty;

if (["simple", "medium", "hard"].includes(mappedDifficulty)) {
  setQuestionForm((prev) => ({
    ...prev,
    difficulty_level: mappedDifficulty,
  }));
} else {
  alert("Unexpected difficulty level returned: " + difficulty);
}

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
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chatper-wise-question`,
        questionForm
      );
      alert("Question created successfully. ID: " + data.questionId);
    } catch (error) {
      console.error("Question creation failed:", error);
      alert(error.response?.data?.message || "Error creating question");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Chapter-wise Question Entry</h1>

      {/* PDF Form */}
      <div className="border p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Step 1: Create PDF Entry</h2>
        <input
          placeholder="Chapter Name"
          className="block border p-2 my-2 w-full"
          value={pdfForm.chapterName}
          onChange={(e) => setPdfForm({ ...pdfForm, chapterName: e.target.value })}
        />
        <input
          placeholder="Subject"
          className="block border p-2 my-2 w-full"
          value={pdfForm.subject}
          onChange={(e) => setPdfForm({ ...pdfForm, subject: e.target.value })}
        />
        <input
          placeholder="Topic Tags (comma-separated)"
          className="block border p-2 my-2 w-full"
          value={pdfForm.topicTags}
          onChange={(e) => setPdfForm({ ...pdfForm, topicTags: e.target.value })}
        />
        <button
          onClick={handleCreatePdf}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Get PDF ID
        </button>
      </div>

      {/* Question Form */}
      <div className="border p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Step 2: Create Question</h2>

        <input
          placeholder="PDF ID"
          className="block border p-2 my-2 w-full"
          value={questionForm.pdfId}
          onChange={(e) =>
            setQuestionForm({ ...questionForm, pdfId: e.target.value })
          }
        />
        
        <textarea
          placeholder="Question Text"
          className="block border p-2 my-2 w-full"
          value={questionForm.question}
          onChange={(e) =>
            setQuestionForm({ ...questionForm, question: e.target.value })
          }
        />

        <h3 className="font-semibold mt-4">Options:</h3>
        {questionForm.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 my-1">
            <input
              placeholder={`Option ${idx + 1}`}
              className="flex-1 border p-2"
              value={opt.option_text}
              onChange={(e) => {
                const updated = [...questionForm.options];
                updated[idx].option_text = e.target.value;
                setQuestionForm({ ...questionForm, options: updated });
              }}
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={opt.is_correct}
                onChange={(e) => {
                  const updated = [...questionForm.options];
                  updated[idx].is_correct = e.target.checked;
                  setQuestionForm({ ...questionForm, options: updated });
                }}
              />
              Correct
            </label>
          </div>
        ))}

        <button
          onClick={handleEvaluateDifficulty}
          className="bg-purple-600 text-white px-4 py-2 rounded mt-2"
        >
          {evaluating ? "Evaluating..." : "Evaluate Difficulty"}
        </button>

        <select
          value={questionForm.difficulty_level}
          onChange={(e) =>
            setQuestionForm({ ...questionForm, difficulty_level: e.target.value })
          }
          className="block border p-2 my-2 w-full"
        >
          <option value="simple">Simple</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <textarea
          placeholder="Solution"
          className="block border p-2 my-2 w-full"
          value={questionForm.solution}
          onChange={(e) =>
            setQuestionForm({ ...questionForm, solution: e.target.value })
          }
        />

        <h3 className="font-semibold mt-4">Upload Diagram:</h3>
        <input
          type="file"
          accept="image/*"
          className="block my-2"
          onChange={handleImageUpload}
        />
        {uploading && <p className="text-sm text-gray-500">Uploading image...</p>}

        <input
          placeholder="Diagram URL"
          className="block border p-2 my-2 w-full"
          value={questionForm.diagramPath}
          onChange={(e) =>
            setQuestionForm({ ...questionForm, diagramPath: e.target.value })
          }
        />

        {questionForm.diagramPath && (
          <div className="mt-2">
            <img
              src={questionForm.diagramPath}
              alt="Uploaded diagram"
              className="max-w-xs border rounded"
            />
            <p className="text-xs break-all text-gray-600 mt-1">{questionForm.diagramPath}</p>
          </div>
        )}

        <button
          onClick={handleCreateQuestion}
          className="bg-green-600 text-white px-4 py-2 rounded mt-4"
        >
          Submit Question
        </button>
      </div>
    </div>
  );
};

export default Page;
