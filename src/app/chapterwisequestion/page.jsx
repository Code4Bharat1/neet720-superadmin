"use client";

import React, { useState, useRef, useEffect } from "react";
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

const [chapter, setChapter] = useState("");
const [subject, setSubject] = useState("Physics");
const [topics, setTopics] = useState([]);
const [topicInput, setTopicInput] = useState("");
const [showEdit, setShowEdit] = useState(true);

useEffect(() => {
  if (typeof window !== "undefined") {
    const storedChapter = localStorage.getItem("mcq_chapter") || "";
    const storedSubject = localStorage.getItem("mcq_subject") || "Physics";
    const storedTopics = JSON.parse(localStorage.getItem("mcq_topics") || "[]");

    setChapter(storedChapter);
    setSubject(storedSubject);
    setTopics(storedTopics);
    setTopicInput(storedTopics.join("\n"));
    setShowEdit(!(storedChapter && storedTopics.length > 0));
  }
}, []);

  

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
  


  useEffect(() => {
  const savedForm = JSON.parse(localStorage.getItem("pdf_form") || "{}");
  setPdfForm({
    chapterName: savedForm.chapterName || "",
    subject: savedForm.subject || "",
    topicTags: savedForm.topicTags || "",
  });
}, []);

// Save to localStorage every time it changes
useEffect(() => {
  localStorage.setItem("pdf_form", JSON.stringify(pdfForm));
}, [pdfForm]);

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
            topic: "",        // For topic suggestion
            diagramPath: "",
            diagramFile: null,
            diagramPreview: "",
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

  // Evaluate difficulty for a question and fetch topic/topic_id
const handleEvaluateDifficulty = async (idx) => {
  const q = extractedQuestions[idx];
  const mcqText =
    `${q.question}\n` +
    q.options
      .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt.option_text}`)
      .join("\n");

  try {
    updateQuestionField(idx, "evaluating", true);

    
    const res = await axios.post(`http://127.0.0.1:5000/api/assess-difficulty`, {
      mcq: mcqText,
      chapter: chapter,
      topics: topics,
      subject: subject,
    });

    const { difficulty, answer, explanation, topic, topic_id } = res.data;
    console.log(topic_id);

    updateQuestionField(idx, "difficulty_level", difficulty === "easy" ? "simple" : difficulty);
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
    updateQuestionField(idx, "topic", topic || "");
    // updateQuestionField(idx, "topic_id", topic_id || "");
    updateQuestionField(idx, "pdfId", topic_id || ""); // ✅ Treat topic_id as pdfId
  } catch (error) {
    alert("Failed to evaluate difficulty.");
  } finally {
    updateQuestionField(idx, "evaluating", false);
  }
};


  // Paste handler (diagram): uploads immediately, sets diagramPath to AWS url
  const handleDiagramPaste = async (e, idx) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
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
            const imageUrl = res.data.url;
            updateQuestionField(idx, "diagramPath", imageUrl);
          } catch (err) {
            alert("Failed to upload pasted image");
          } finally {
            setUploading(false);
          }
          break;
        }
      }
    }
  };

  const handleDiagramUpload = async (e, idx) => {
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
      const imageUrl = res.data.url;
      updateQuestionField(idx, "diagramPath", imageUrl);
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDiagram = (idx) => {
    updateQuestionField(idx, "diagramPath", "");
    updateQuestionField(idx, "diagramFile", null);
    updateQuestionField(idx, "diagramPreview", "");
  };

  // Submit a single question (upload pasted diagram if any)
const handleCreateQuestion = async (idx) => {
  const q = extractedQuestions[idx];
  let diagramUrl = q.diagramPath;

  if (!diagramUrl && q.diagramFile) {
    const formData = new FormData();
    formData.append("file", q.diagramFile);
    try {
      setUploading(true);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      diagramUrl = res.data.url;
    } catch (err) {
      alert("Failed to upload pasted image");
      setUploading(false);
      return;
    } finally {
      setUploading(false);
    }
  }

  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/chatper-wise-question`,
      { ...q, diagramPath: diagramUrl }
    );

    alert(`Question ${idx + 1} created successfully.`);

    // ✅ Mark question as submitted
    setExtractedQuestions((prev) => {
      const updated = [...prev];
      updated[idx].submitted = true;
      return updated;
    });

    // ✅ Update submitted count
    setSubmittedCount((c) => {
      const newCount = c + 1;
      localStorage.setItem("mcq_submitted_count", newCount.toString());
      return newCount;
    });
  } catch (error) {
    alert("Error creating question: " + (error.response?.data?.message || ""));
  }
};


  // Step 1: PDF creation
  const handleCreatePdf = async () => {
    try {
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pdfid`, {
        chapterName: pdfForm.chapterName,
        subject: pdfForm.subject,
        topicTags: pdfForm.topicTags.split(",").map(tag => tag.trim()),
      });

      setPdfId(data.pdfId);
      setExtractedQuestions(prev => prev.map(q => ({ ...q, pdfId: data.pdfId })));
      alert("PDF Created. PDF ID: " + data.pdfId);
    } catch (error) {
      alert(error.response?.data?.message || "Error creating PDF");
    }
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

              <h3 className="font-semibold mt-4">Topic Suggestion:</h3>
              <input
                placeholder="Topic (suggested, editable)"
                className="block border p-2 my-2 w-full"
                value={q.topic || ""}
                onChange={(e) =>
                  updateQuestionField(idx, "topic", e.target.value)
                }
              />

              {/* <input
                placeholder="Topic ID (auto-fetched, editable)"
                className="block border p-2 my-2 w-full"
                value={q.topic_id || ""}
                onChange={(e) =>
                  updateQuestionField(idx, "topic_id", e.target.value)
                }
              /> */}

              <h3 className="font-semibold mt-4">Paste or Upload Diagram:</h3>
              <div
                tabIndex={0}
                onPaste={(e) => handleDiagramPaste(e, idx)}
                className="border-2 border-dashed border-green-400 rounded p-4 text-center mb-2 cursor-pointer hover:bg-green-50 focus:bg-green-50"
                style={{ minHeight: "60px" }}
                title="Paste a diagram image here (Ctrl+V)"
              >
                <span className="text-gray-700 text-sm">
                  <b>Paste</b> your diagram here (Ctrl+V or ⌘+V)
                  <br />or&nbsp;
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleDiagramUpload(e, idx)}
                    className="inline-block ml-2"
                  />
                </span>
              </div>

              <input
                placeholder="Diagram URL"
                className="block border p-2 my-2 w-full"
                value={q.diagramPath}
                onChange={(e) =>
                  updateQuestionField(idx, "diagramPath", e.target.value)
                }
              />

              {(q.diagramPreview || q.diagramPath) && (
                <div className="mt-2 relative w-fit">
                  <img
                    src={q.diagramPreview || q.diagramPath}
                    alt="Diagram preview"
                    className="max-w-xs border rounded"
                  />
                  <button
                    onClick={() => handleRemoveDiagram(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600"
                    title="Remove image"
                  >
                    ✕
                  </button>
                  {q.diagramPath && (
                    <p className="text-xs break-all text-gray-600 mt-1">
                      {q.diagramPath}
                    </p>
                  )}
                </div>
              )}

              <button
  className={`px-4 py-2 rounded mt-4 ${
    q.submitted ? "bg-green-300 cursor-not-allowed" : "bg-green-600 text-white"
  }`}
  onClick={() => handleCreateQuestion(idx)}
  disabled={uploading || q.submitted}
>
  {q.submitted ? "✅ Submitted" : uploading ? "Uploading..." : "Submit Question"}
</button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
