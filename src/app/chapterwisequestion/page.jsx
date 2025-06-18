"use client";

import React, { useState, useRef } from "react";
import axios from "axios";

const Page = () => {
  // PDF form state
  const [pdfForm, setPdfForm] = useState({
    chapterName: "",
    subject: "",
    topicTags: "",
  });

  const [pdfId, setPdfId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("mcq_submitted_count") || "0", 10);
    }
    return 0;
  });

  // MCQ Extraction state
  const [mcqImage, setMcqImage] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const pasteBoxRef = useRef(null);

  // Handler for image paste (extract MCQs)
  const handlePasteImage = (e) => {
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

  // Handler for image upload (extract MCQs)
  const handleMcqImageChange = (e) => {
    setMcqImage(e.target.files[0]);
  };

  // Extract MCQs from the image
  const handleExtractMcqs = async () => {
    if (!mcqImage) {
      alert("Please paste or upload an image first.");
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
      const mcqs = res.data.mcqs;
      if (Array.isArray(mcqs)) {
        setExtractedQuestions(
          mcqs.map((mcq) => ({
            ...mcq,
            options: (mcq.options || []).map((opt, i) => ({
              option_text: opt,
              is_correct: mcq.answer?.toLowerCase() === "abcd"[i],
            })),
            solution: "",
            difficulty_level: "medium",
            evaluating: false,
            evaluated: false,
            pdfId: pdfId || "",
            diagramPath: "", // will hold url (if uploaded) or local preview (if pasted)
            diagramFile: null, // will hold File/Blob if pasted
            diagramPreview: "", // for pasted image preview (object url or base64)
          }))
        );
      } else {
        setExtractError("No MCQs found in response.");
      }
    } catch (err) {
      setExtractError(
        "Failed to extract MCQs: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setExtracting(false);
    }
  };

  // Update question field
  const updateQuestionField = (idx, field, value) => {
    setExtractedQuestions((prev) => {
      const arr = [...prev];
      arr[idx][field] = value;
      return arr;
    });
  };

  // Update an option field
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

  // Evaluate difficulty for a question
  const handleEvaluateDifficulty = async (idx) => {
  const q = extractedQuestions[idx];
  const mcqText =
    `${q.question}\n` +
    q.options
      .map(
        (opt, i) => `${String.fromCharCode(65 + i)}. ${opt.option_text}`
      )
      .join("\n");
  try {
    updateQuestionField(idx, "evaluating", true);

    const res = await axios.post("http://localhost:5000/api/assess-difficulty", {
      mcq: mcqText,
      chapter: pdfForm.chapterName,
      topics: pdfForm.topicTags.split(",").map(tag => tag.trim()),
      subject: pdfForm.subject,
    });

    console.log(res.data);
    const { difficulty, answer, explanation, topic, topic_id } = res.data;

    // Save topic name and topic ID to localStorage
    localStorage.setItem("topicName", topic);
    localStorage.setItem("topicId", topic_id);

    // *** set topic to question ***
    updateQuestionField(idx, "topic", topic);

    updateQuestionField(idx, "difficulty_level", difficulty);
    updateQuestionField(idx, "solution", explanation);
    updateQuestionField(
      idx,
      "options",
      q.options.map((opt, i) => ({
        ...opt,
        is_correct: String.fromCharCode(65 + i) === (answer || "").toUpperCase(),
      }))
    );
    updateQuestionField(idx, "evaluated", true);
  } catch (error) {
    alert("Failed to evaluate difficulty.");
  } finally {
    updateQuestionField(idx, "evaluating", false);
  }
};


  // Save to localStorage and send data to backend to get topic name and ID
  const handleFormSubmit = async () => {
    if (!pdfForm.chapterName || !pdfForm.subject || !pdfForm.topicTags) {
      alert("Please fill in chapter, subject, and topics fields.");
      return;
    }

    // Save data to localStorage
    localStorage.setItem("chapterName", pdfForm.chapterName);
    localStorage.setItem("subject", pdfForm.subject);
    localStorage.setItem("topicTags", pdfForm.topicTags);

    await handleExtractMcqs();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="text-green-700 font-medium">
        Total Questions Submitted: {submittedCount}
      </div>
      <button
        className="text-sm text-red-600 underline ml-2"
        onClick={() => {
          const confirmReset = window.confirm("Are you sure you want to reset the submitted count?");
          if (confirmReset) {
            localStorage.setItem("mcq_submitted_count", "0");
            setSubmittedCount(0);
          }
        }}
      >
        Reset Count
      </button>

      {/* Chapter, Subject, and Topic Form Section */}
      <div className="border p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold">Step 1: Enter Chapter, Subject, and Topics</h2>
        <input
          type="text"
          className="border p-2 w-full mb-2"
          placeholder="Chapter Name"
          value={pdfForm.chapterName}
          onChange={(e) =>
            setPdfForm((prev) => ({ ...prev, chapterName: e.target.value }))
          }
        />
        <input
          type="text"
          className="border p-2 w-full mb-2"
          placeholder="Subject Name"
          value={pdfForm.subject}
          onChange={(e) =>
            setPdfForm((prev) => ({ ...prev, subject: e.target.value }))
          }
        />
        <textarea
          className="border p-2 w-full mb-2"
          placeholder="Enter topics, separated by commas"
          value={pdfForm.topicTags}
          onChange={(e) =>
            setPdfForm((prev) => ({ ...prev, topicTags: e.target.value }))
          }
          rows={4}
        />
        <button
          onClick={handleFormSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Data & Extract MCQs
        </button>
      </div>

      {/* MCQ Extraction and Question Forms */}
      <div className="border p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold">Step 2: Paste/Upload MCQ Image & Extract</h2>
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
            or click to focus and paste, or
            <input
              type="file"
              accept="image/*"
              onChange={handleMcqImageChange}
              className="ml-2"
            />
          </span>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleExtractMcqs}
          disabled={extracting}
        >
          {extracting ? "Extracting..." : "Extract MCQs"}
        </button>
        {extractError && <p className="text-red-500 mt-2">{extractError}</p>}
        {mcqImage && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(mcqImage)}
              alt="MCQ upload preview"
              className="max-w-xs border rounded"
            />
          </div>
        )}
      </div>

      {extractedQuestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Step 3: Review, Evaluate & Submit Each MCQ
          </h2>
          {extractedQuestions.map((q, idx) => (
            <div
              key={idx}
              className="mb-8 border p-4 rounded shadow bg-gray-50"
            >
              <div className="font-bold mb-2">Question {idx + 1}</div>
              <input
                placeholder="PDF ID"
                className="block border p-2 my-2 w-full"
                value={q.pdfId || pdfId || ""}
                onChange={(e) =>
                  updateQuestionField(idx, "pdfId", e.target.value)
                }
              />
              <textarea
                className="block border p-2 my-2 w-full"
                value={q.question}
                onChange={(e) =>
                  updateQuestionField(idx, "question", e.target.value)
                }
              />
              <h3 className="font-semibold mt-4">Options:</h3>
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
  <div className="mb-2">
    <span className="font-semibold text-gray-700">Topic:&nbsp;</span>
    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">{q.topic}</span>
  </div>
)}

              <select
                value={q.difficulty_level}
                onChange={(e) =>
                  updateQuestionField(idx, "difficulty_level", e.target.value)
                }
                className="block border p-2 my-2 w-full"
              >
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>


              <textarea
                className="block border p-2 my-2 w-full"
                placeholder="Solution"
                value={q.solution}
                onChange={(e) =>
                  updateQuestionField(idx, "solution", e.target.value)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
