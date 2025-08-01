"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

function formatMcqJsonForUI(mcq, pdfId = "") {
  const answerIdx = "abcd".indexOf((mcq.answer || "").toLowerCase());
  return {
    question: mcq.question,
    options: (mcq.options || []).map((text, idx) => ({
      option_text: text,
      is_correct: idx === answerIdx,
    })),
    solution: "",
    difficulty_level: "medium",
    evaluating: false,
    submitting: false,
    evaluated: false,
    pdfId: pdfId || "",
    topic: "",
    topic_id: "",
    diagramPath: "",
  };
}

const Page = () => {
  // Subject/Chapter/Topics state
  const [chapter, setChapter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcq_chapter") || "";
    }
    return "";
  });
  const [subject, setSubject] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mcq_subject") || "Physics"; // Default subject
    }
    return "Physics";
  });
  const [topics, setTopics] = useState(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("mcq_topics");
      return t ? JSON.parse(t) : [];
    }
    return [];
  });
  const [showEdit, setShowEdit] = useState(() => {
    if (typeof window !== "undefined") {
      return !(localStorage.getItem("mcq_chapter") && localStorage.getItem("mcq_topics"));
    }
    return true;
  });
  const [topicInput, setTopicInput] = useState(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("mcq_topics");
      if (t) return JSON.parse(t).join("\n");
    }
    return "";
  });

  const pasteBoxRef = useRef(null);
  const [mcqImage, setMcqImage] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [pdfId, setPdfId] = useState("");
  const [pdfIdLoading, setPdfIdLoading] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("mcq_submitted_count") || "0", 10);
    }
    return 0;
  });

  useEffect(() => {
    if (topics.length > 0) setTopicInput(topics.join("\n"));
  }, [topics]);

  // Handle paste for images
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

  const handleMcqImageChange = (e) => {
    setMcqImage(e.target.files[0]);
  };

  // PDF ID fetcher
  const handleGetPdfId = async () => {
    if (!chapter || topics.length === 0 || !subject) {
      alert("Please set chapter name, topics, and subject first.");
      setShowEdit(true);
      return;
    }
    setPdfIdLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/pdfid", // <<=== Your endpoint
        {
          chapterName: chapter,
          subject: subject,  // Added subject field
          topicTags: topics,
        }
      );
      if (res.data.pdfId) {
        setPdfId(res.data.pdfId);
        setExtractedQuestions((prev) =>
          prev.map((q) => ({ ...q, pdfId: res.data.pdfId }))
        );
      } else {
        alert("PDF ID not received from backend.");
      }
    } catch (err) {
      alert("Failed to get PDF ID from backend.");
    }
    setPdfIdLoading(false);
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
        "http://127.0.0.1:5000/api/extract-mcqs",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const mcqs = res.data.mcqs;
      if (Array.isArray(mcqs)) {
        setExtractedQuestions(mcqs.map((mcq) => formatMcqJsonForUI(mcq, pdfId)));
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

  // Whenever backend sends topic_id, set both topic_id and pdfId for that MCQ
  const handleEvaluateDifficulty = async (idx) => {
    if (!chapter || topics.length === 0 || !subject) {
      alert("Please set chapter name, topics, and subject first.");
      setShowEdit(true);
      return;
    }

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
          chapter: chapter,
          topics: topics,
          subject: subject,  // Added subject field
        }
      );

      console.log(res.data);
      const { difficulty, answer, explanation, topic, topic_id } = res.data;
      
      const mappedDifficulty =
        difficulty === "easy" ? "simple" : difficulty;
      setExtractedQuestions((prev) => {
        const arr = [...prev];
        arr[idx].difficulty_level = mappedDifficulty;
        arr[idx].solution = explanation;
        arr[idx].topic = topic || "";
        arr[idx].topic_id = topic_id || "";
        // Set topic_id as pdfId for this question if present:
        if (topic_id) arr[idx].pdfId = String(topic_id);
        arr[idx].options = arr[idx].options.map((opt, i) => ({
          ...opt,
          is_correct:
            String.fromCharCode(65 + i) === (answer || "").toUpperCase(),
        }));
        arr[idx].evaluated = true;
        arr[idx].evaluating = false;
        return arr;
      });
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
    q.pdfId = q.pdfId || pdfId;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chatper-wise-question`,
        q
      );
      const currentCount = parseInt(localStorage.getItem("mcq_submitted_count") || "0", 10);
      localStorage.setItem("mcq_submitted_count", (currentCount + 1).toString());
      setSubmittedCount(currentCount + 1);

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
      <div className="text-xl font-semibold text-green-700 mb-4">
        Total Questions Submitted: {submittedCount}
      </div>
      <button
        onClick={() => {
          if (window.confirm("Are you sure you want to reset the submitted count?")) {
            localStorage.setItem("mcq_submitted_count", "0");
            setSubmittedCount(0);
          }
        }}
        className="ml-4 text-sm text-red-600 underline"
      >
        Reset Count
      </button>

      {/* Chapter/Topics/Subjects section */}
      <div className="border p-4 rounded shadow mb-4 bg-gray-50">
        {showEdit ? (
          <div>
            <h2 className="font-semibold mb-2">Set Chapter, Topics, and Subject</h2>
            <input
              className="border p-2 w-full my-2"
              placeholder="Chapter Name"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
            />
            <input
              className="border p-2 w-full my-2"
              placeholder="Subject Name"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                localStorage.setItem("mcq_subject", e.target.value);
              }}
            />
            <textarea
              className="border p-2 w-full my-2"
              placeholder="Enter topics, one per line"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              rows={4}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => {
                const topicsArr = topicInput
                  .split("\n")
                  .map((t) => t.trim())
                  .filter(Boolean);
                setTopics(topicsArr);
                setShowEdit(false);
                localStorage.setItem("mcq_chapter", chapter);
                localStorage.setItem("mcq_topics", JSON.stringify(topicsArr));
              }}
              disabled={!chapter || !topicInput.trim()}
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div>
                <span className="font-semibold">Chapter:</span> {chapter}
              </div>
              <div>
                <span className="font-semibold">Subject:</span> {subject}
              </div>
              <div>
                <span className="font-semibold">Topics:</span>{" "}
                {topics.map((t) => (
                  <span
                    key={t}
                    className="inline-block bg-blue-200 text-blue-800 px-2 py-1 m-1 rounded text-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="bg-gray-600 text-white px-3 py-2 rounded"
              onClick={() => {
                setShowEdit(true);
                setTopicInput(topics.join("\n"));
              }}
            >
              Edit Chapter/Topics
            </button>
          </div>
        )}
        {/* <div className="flex items-center mt-4">
          <input
            className="border p-2 w-full max-w-xs"
            placeholder="PDF ID (auto or manual)"
            value={pdfId}
            onChange={e => {
              setPdfId(e.target.value);
              setExtractedQuestions((prev) => prev.map(q => ({ ...q, pdfId: e.target.value })));
            }}
          />
          <button
            className="ml-2 px-3 py-2 rounded bg-blue-600 text-white"
            onClick={handleGetPdfId}
            disabled={pdfIdLoading || !chapter || !topics.length}
          >
            {pdfIdLoading ? "Loading..." : "Get PDF ID"}
          </button>
        </div> */}
      </div>

      <div
        ref={pasteBoxRef}
        tabIndex={0}
        onPaste={handlePasteImage}
        className="border-2 border-dashed border-blue-400 rounded p-6 text-center mb-4 cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
        style={{ minHeight: "80px" }}
        onClick={() => pasteBoxRef.current && pasteBoxRef.current.focus()}
      >
        <span className="text-gray-700">
          <b>Paste</b> your image snippet here (Ctrl+V or ⌘+V)
          <br />
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
              <input
                placeholder="PDF ID (editable)"
                className="block border p-2 my-2 w-full max-w-xs"
                value={q.pdfId || ""}
                onChange={e => updateQuestionField(idx, "pdfId", e.target.value)}
              />
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
                  <input
                    className="border p-2 w-full max-w-xs"
                    value={q.topic}
                    onChange={e =>
                      updateQuestionField(idx, "topic", e.target.value)
                    }
                  />
                </div>
              )}
              <input
                placeholder="Topic ID (auto-fetched, editable)"
                className="block border p-2 my-2 w-full max-w-xs"
                value={q.topic_id}
                onChange={e =>
                  updateQuestionField(idx, "topic_id", e.target.value)
                }
              />

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