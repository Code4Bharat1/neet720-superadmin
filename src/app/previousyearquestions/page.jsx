"use client";

import React, { useState } from "react";
import axios from "axios";

const Page = () => {
  const [form, setForm] = useState({
    year: "",
    subject: "Physics",
    question: "",
    correctAnswer: "",
    options: ["", "", "", ""],
    solution: "",
    diagramUrl: "",
  });

  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...form.options];
    updatedOptions[index] = value;
    setForm((prev) => ({ ...prev, options: updatedOptions }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setForm((prev) => ({ ...prev, diagramUrl: res.data.url }));
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, diagramUrl: "" }));
  };

const handleEvaluateAnswer = async () => {
  const mcqText =
    `${form.question}\n` +
    form.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n");

  try {
    setEvaluating(true);
    const res = await axios.post("http://localhost:5000/api/assess-difficulty", {
      mcq: mcqText,
    });

    const { answer, explanation } = res.data;

    const answerIndex = "ABCD".indexOf(answer.toUpperCase());

    if (answerIndex === -1 || !form.options[answerIndex]) {
      alert("Invalid answer received from AI.");
      return;
    }

    const fullAnswerText = form.options[answerIndex];

    setForm((prev) => ({
      ...prev,
      correctAnswer: fullAnswerText, // store full answer
      solution: explanation,
    }));
  } catch (error) {
    console.error("Evaluation failed:", error);
    alert("Failed to evaluate correct answer.");
  } finally {
    setEvaluating(false);
  }
};


  const handleSubmit = async () => {
    try {
      const payload = {
        year: parseInt(form.year),
        subject: form.subject,
        question: form.question,
        correctAnswer: form.correctAnswer,
        options: {
          a: form.options[0],
          b: form.options[1],
          c: form.options[2],
          d: form.options[3],
        },
        solution: form.solution,
        diagramUrl: form.diagramUrl,
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/create-questions`,
        payload
      );

      alert("Question saved successfully.");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save question.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Previous Year Question Entry</h1>

      <input
        type="number"
        placeholder="Year"
        className="w-full border p-2"
        value={form.year}
        onChange={(e) => handleChange("year", e.target.value)}
      />

      <select
        className="w-full border p-2"
        value={form.subject}
        onChange={(e) => handleChange("subject", e.target.value)}
      >
        <option value="Physics">Physics</option>
        <option value="Chemistry">Chemistry</option>
        <option value="Biology">Biology</option>
      </select>

      <textarea
        placeholder="Question"
        className="w-full border p-2"
        value={form.question}
        onChange={(e) => handleChange("question", e.target.value)}
      />

      <h3 className="font-semibold">Options:</h3>
      {form.options.map((opt, idx) => (
        <input
          key={idx}
          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
          className="w-full border p-2 mb-2"
          value={opt}
          onChange={(e) => handleOptionChange(idx, e.target.value)}
        />
      ))}

      <button
        onClick={handleEvaluateAnswer}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        {evaluating ? "Evaluating..." : "Get Correct Answer & Solution"}
      </button>

      <input
        placeholder="Correct Answer (e.g., A)"
        className="w-full border p-2"
        value={form.correctAnswer}
        onChange={(e) => handleChange("correctAnswer", e.target.value)}
      />

      <textarea
        placeholder="Solution"
        className="w-full border p-2"
        value={form.solution}
        onChange={(e) => handleChange("solution", e.target.value)}
      />

      <h4 className="font-semibold">Upload Diagram:</h4>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}

      {form.diagramUrl && (
        <div className="relative w-fit mt-2">
          <img
            src={form.diagramUrl}
            alt="Diagram"
            className="max-w-xs border rounded"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600"
          >
            ✕
          </button>
          <p className="text-xs break-all text-gray-600 mt-1">
            {form.diagramUrl}
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-6 py-3 rounded mt-4"
      >
        Submit Question
      </button>
    </div>
  );
};

export default Page;
