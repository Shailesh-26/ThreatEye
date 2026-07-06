import { useState, useEffect } from "react";
import { Upload, FileText, ShieldCheck } from "lucide-react";
import { uploadLogs, fetchLogs } from "../services/logService";

export default function Logs() {
    const [dragging, setDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [logs, setLogs] = useState([]);

    const loadLogs = async () => {
        try {
            const data = await fetchLogs();
            setLogs(data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);

        if (e.dataTransfer.files.length > 0) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleBrowse = (e) => {
        if (e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setUploading(true);

            const res = await uploadLogs(selectedFile);

            setMessage(res.message);

            // Refresh uploaded logs after successful upload
            loadLogs();
        } catch (err) {
            setMessage(
                err?.response?.data?.detail || "Upload failed."
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-5xl font-black">
                    Security Logs
                </h1>

                <p className="mt-2 text-zinc-400">
                    Upload CSV, JSON or Syslog files for threat analysis.
                </p>
            </div>

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`
                    transition-all
                    duration-300
                    rounded-3xl
                    border-2
                    border-dashed
                    p-14
                    text-center

                    ${
                        dragging
                            ? "border-green-400 bg-green-500/10 scale-[1.02]"
                            : "border-zinc-700 bg-[#0b1012]"
                    }
                `}
            >
                <Upload
                    className="mx-auto mb-6 text-green-400"
                    size={60}
                />

                <h2 className="text-3xl font-bold">
                    Drag & Drop Security Logs
                </h2>

                <p className="mt-3 text-zinc-400">
                    Supports CSV, XLSX, JSON and TXT security logs
                </p>

                <label
                    className="
                        mt-8
                        inline-flex
                        cursor-pointer
                        rounded-xl
                        bg-green-500
                        px-8
                        py-3
                        font-semibold
                        text-black
                        transition
                        hover:scale-105
                    "
                >
                    Browse Files

                    <input
                        hidden
                        type="file"
                        accept=".csv,.xlsx,.json,.txt"
                        onChange={handleBrowse}
                    />
                </label>
            </div>

            {selectedFile && (
                <div className="rounded-2xl border border-green-500/20 bg-[#0d1115] p-6">
                    <div className="flex items-center gap-4">
                        <FileText
                            className="text-green-400"
                            size={34}
                        />

                        <div>
                            <h3 className="font-bold">
                                {selectedFile.name}
                            </h3>

                            <p className="text-sm text-zinc-500">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleUpload}
                        className="
                            mt-6
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            bg-green-500
                            px-8
                            py-3
                            font-semibold
                            text-black
                            transition
                            hover:scale-105
                        "
                    >
                        <ShieldCheck size={22} />

                        {uploading ? "Uploading..." : "Analyze Logs"}
                    </button>

                    {message && (
                        <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-400">
                            {message}
                        </div>
                    )}
                </div>
            )}

            {/* Uploaded Logs Table */}
            {logs.length > 0 && (
                <div className="rounded-2xl border border-zinc-800 bg-[#0d1115] p-6">
                    <h2 className="mb-5 text-2xl font-bold">
                        Uploaded Logs
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-green-400">
                                <tr>
                                    <th className="pb-3">Timestamp</th>
                                    <th className="pb-3">Source IP</th>
                                    <th className="pb-3">Event</th>
                                    <th className="pb-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {logs.map((log, index) => (
                                    <tr
                                        key={index}
                                        className="border-t border-zinc-800"
                                    >
                                        <td className="py-3">
                                            {log.timestamp}
                                        </td>
                                        <td>{log.source_ip}</td>
                                        <td>{log.event_type}</td>
                                        <td>{log.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}