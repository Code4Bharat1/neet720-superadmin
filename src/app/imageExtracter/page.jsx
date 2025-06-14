"use client";

import React, { useState, useRef } from "react";
import axios from "axios";

// Updated parser for multiple MCQs, even with bold/numbering!
function parseMcqs(markdown) {
  if (!markdown) return [];
  // Split at bold or plain numbers at line start (handles **8.**, 9., etc)
  const blocks = markdown
    .split(/\n\s*(?:\*\*)?\d+\.(?:\*\*)?\s*/)
    .filter(Boolean);

  return blocks.map((block) => {
    const lines = block.trim().split("\n").filter(Boolean);
    const questionLine = lines[0] || "";
    // Remove leading "**8.**" or "8."
    const questionText = questionLine.replace(/^(?:\*\*)?\d+\.(?:\*\*)?\s*/, "");

    // Find options: (a)-(d)
    const options = ["a", "b", "c", "d"].map((letter) => {
      const optLine = lines.find((l) =>
        l.trim().toLowerCase().startsWith(`(${letter})`)
      );
      return {
        option_text: optLine ? optLine.replace(/^\([a-d]\)\s*/i, "") : "",
        is_correct: false,
      };
    });

    // Find answer: Answer: (b)
    const answerLine = lines.find((l) =>
      l.toLowerCase().includes("answer")
    );
    let answerLetter = null;
    if (answerLine) {
      const m = answerLine.match(/[(\[]([a-dA-D])[\])]/);
      if (m) answerLetter = m[1].toLowerCase();
    }
    if (answerLetter) {
      options.forEach((opt, idx) => {
        opt.is_correct = "abcd"[idx] === answerLetter;
      });
    }

    return {
      question: questionText,
      options,
      solution: "",
      difficulty_level: "medium",
      evaluating: false,
      submitting: false,
      evaluated: false,
      pdfId: "",
      topic: "",
      diagramPath: "",
    };
  });
}

const Page = () => {
  // MCQ extraction
  const pasteBoxRef = useRef(null);
  const [mcqImage, setMcqImage] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [pdfId, setPdfId] = useState("");

  const handlePasteImage = (e) => {
    // Check clipboard items for image
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setMcqImage(file);
          setExtractError(null);
          break;
        }
      }
    }
  };

  // Handle image change and extraction
  const handleMcqImageChange = (e) => {
    setMcqImage(e.target.files[0]);
  };

  const handleExtractMcqs = async () => {
    if (!mcqImage) {
      alert("Please upload an image first.");
      return;
    }
    setExtracting(true);
    setExtractError(null);
    setExtractedQuestions([]);

    try {
      const formData = new FormData();
      formData.append("image", mcqImage);

      const res = await axios.post(
        "http://localhost:5000/api/extract-mcqs",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const mcqs = res.data.mcq_markdown;
      const parsedQuestions = parseMcqs(mcqs);
      setExtractedQuestions(parsedQuestions);
    } catch (err) {
      setExtractError(
        "Failed to extract MCQs: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setExtracting(false);
    }
  };

  // Update individual question
  const updateQuestionField = (idx, field, value) => {
    setExtractedQuestions((prev) => {
      const arr = [...prev];
      arr[idx][field] = value;
      return arr;
    });
  };

  // Update individual option
  const updateOptionField = (qIdx, optIdx, field, value) => {
    setExtractedQuestions((prev) => {
      const arr = [...prev];
      arr[qIdx].options = arr[qIdx].options.map((opt, i) =>
        i === optIdx
          ? { ...opt, [field]: value }
          : { ...opt, is_correct: field === "is_correct" ? false : opt.is_correct }
      );
      return arr;
    });
  };

  // Evaluate
  const handleEvaluateDifficulty = async (idx) => {
    setExtractedQuestions((prev) => {
      const arr = [...prev];
      arr[idx].evaluating = true;
      return arr;
    });

    const q = extractedQuestions[idx];
    const mcqText =
      `${q.question}\n` +
      q.options
        .map(
          (opt, i) =>
            `${String.fromCharCode(65 + i)}. ${opt.option_text}`
        )
        .join("\n");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/assess-difficulty",
        {
          mcq: mcqText,
          chapter: "",
        }
      );
      const { difficulty, answer, explanation, topic, topic_id } = res.data;
      const mappedDifficulty =
        difficulty === "easy" ? "simple" : difficulty;
      setExtractedQuestions((prev) => {
        const arr = [...prev];
        arr[idx].difficulty_level = mappedDifficulty;
        arr[idx].solution = explanation;
        arr[idx].topic = topic || "";
        arr[idx].options = arr[idx].options.map((opt, i) => ({
          ...opt,
          is_correct:
            String.fromCharCode(65 + i) === answer.toUpperCase(),
        }));
        arr[idx].evaluated = true;
        arr[idx].evaluating = false;
        return arr;
      });

      // SET PDF ID AUTOMATICALLY TO TOPIC_ID
      if (topic_id) setPdfId(topic_id.toString());

    } catch (error) {
      setExtractedQuestions((prev) => {
        const arr = [...prev];
        arr[idx].evaluating = false;
        return arr;
      });
      alert("Failed to evaluate difficulty.");
    }
  };

  // Submit
  const handleSubmitExtractedQuestion = async (idx) => {
    setExtractedQuestions((prev) => {
      const arr = [...prev];
      arr[idx].submitting = true;
      return arr;
    });

    const q = { ...extractedQuestions[idx] };
    if (pdfId) q.pdfId = pdfId;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chatper-wise-question`,
        q
      );
      setExtractedQuestions((prev) => {
        const arr = [...prev];
        arr[idx].submitting = false;
        arr[idx].submitted = true;
        return arr;
      });
      alert(`Question ${idx + 1} created successfully.`);
    } catch (error) {
      setExtractedQuestions((prev) => {
        const arr = [...prev];
        arr[idx].submitting = false;
        return arr;
      });
      alert("Error creating question: " + (error.response?.data?.message || ""));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div
        ref={pasteBoxRef}
        tabIndex={0}
        onPaste={handlePasteImage}
        className="border-2 border-dashed border-blue-400 rounded p-6 text-center mb-4 cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
        style={{ minHeight: "80px" }}
        onClick={() => pasteBoxRef.current && pasteBoxRef.current.focus()}
      >
        <span className="text-gray-700">
          <b>Paste</b> your image snippet here (Ctrl+V or ⌘+V)<br />
          or click to focus and paste
        </span>
      </div>

      <h1 className="text-xl font-bold mb-4">Extract & Submit MCQs</h1>
      <div className="border p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold">Step 1: Upload MCQ Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleMcqImageChange}
        />
        <button
          onClick={handleExtractMcqs}
          className="bg-blue-600 text-white px-4 py-2 rounded ml-2"
          disabled={extracting}
        >
          {extracting ? "Extracting..." : "Extract MCQs"}
        </button>
        {extractError && (
          <p className="text-red-500 mt-2">{extractError}</p>
        )}
        {mcqImage && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(mcqImage)}
              alt="MCQ upload preview"
              className="max-w-xs border rounded"
            />
          </div>
        )}
        <input
          placeholder="PDF ID (auto-filled after evaluation)"
          className="block border p-2 my-2 w-full max-w-xs"
          value={pdfId}
          onChange={(e) => setPdfId(e.target.value)}
        />
      </div>

      {extractedQuestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Step 2: Review, Evaluate & Submit Each MCQ
          </h2>
          {extractedQuestions.map((q, idx) => (
            <div
              key={idx}
              className="mb-8 border p-4 rounded shadow bg-gray-50"
            >
              <div className="font-bold mb-2">Question {idx + 1}</div>
              <textarea
                className="block border p-2 my-2 w-full"
                value={q.question}
                onChange={(e) =>
                  updateQuestionField(idx, "question", e.target.value)
                }
              />
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 my-1">
                  <input
                    className="flex-1 border p-2"
                    value={opt.option_text}
                    onChange={(e) =>
                      updateOptionField(idx, i, "option_text", e.target.value)
                    }
                  />
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={opt.is_correct}
                      onChange={(e) =>
                        updateOptionField(idx, i, "is_correct", e.target.checked)
                      }
                    />
                    Correct
                  </label>
                </div>
              ))}

              <button
                onClick={() => handleEvaluateDifficulty(idx)}
                className="bg-purple-600 text-white px-4 py-2 rounded mt-4"
                disabled={q.evaluating}
              >
                {q.evaluating
                  ? "Evaluating..."
                  : q.evaluated
                  ? "Evaluated"
                  : "Evaluate"}
              </button>
              {q.topic && (
                <div className="my-2">
                  <span className="font-semibold text-gray-700">Topic:&nbsp;</span>
                  <span className="text-blue-600">{q.topic}</span>
                </div>
              )}
              <textarea
                className="block border p-2 my-2 w-full"
                placeholder="Solution"
                value={q.solution}
                onChange={(e) =>
                  updateQuestionField(idx, "solution", e.target.value)
                }
              />
              <button
                className={`bg-green-600 text-white px-4 py-2 rounded mt-2 ${
                  q.submitting ? "opacity-50" : ""
                }`}
                onClick={() => handleSubmitExtractedQuestion(idx)}
                disabled={q.submitting || q.submitted}
              >
                {q.submitting
                  ? "Submitting..."
                  : q.submitted
                  ? "Submitted"
                  : "Submit Question"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
