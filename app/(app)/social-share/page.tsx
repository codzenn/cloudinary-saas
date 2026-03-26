"use client";

import React, { useState, useEffect, useRef } from "react";
import { CldImage } from "next-cloudinary";

const socialFormats = {
  "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },
  "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },
  "Twitter Post (16:9)": { width: 1200, height: 675, aspectRatio: "16:9" },
  "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },
  "Facebook Cover (205:78)": { width: 820, height: 312, aspectRatio: "205:78" },
};

type SocialFormat = keyof typeof socialFormats;

export default function SocialShare() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>(
    "Instagram Square (1:1)",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (uploadedImage) {
      setIsTransforming(true);
    }
  }, [selectedFormat, uploadedImage]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setUploadedImage(data.public_id);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDownload = () => {
    if (!imageRef.current) return;

    fetch(imageRef.current.src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedFormat.replace(/\s+/g, "_").toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl font-sans">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Social Media Image Formatter
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-4 space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer"
            />
            {isUploading && (
              <p className="text-sm text-blue-600 mt-2 font-medium animate-pulse">
                Uploading to Cloudinary...
              </p>
            )}
          </div>

          {/* Format Selection & Download (Hidden until image uploaded) */}
          {uploadedImage && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Target Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) =>
                    setSelectedFormat(e.target.value as SocialFormat)
                  }
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  {Object.keys(socialFormats).map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleImageDownload}
                  disabled={isTransforming || isUploading}
                  className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {isTransforming ? "Processing Image..." : "Download Image"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Preview */}
        <div className="lg:col-span-8 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-inner min-h-125 flex items-center justify-center relative overflow-hidden">
          {uploadedImage ? (
            <div className="relative w-full h-full flex justify-center items-center">
              {/* Loading Overlay for Cloudinary Transformations */}
              {isTransforming && (
                <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-gray-700 font-medium text-sm">
                      Applying Crop & Format...
                    </span>
                  </div>
                </div>
              )}

              {/* Cloudinary Image Component */}
              <CldImage
                src={uploadedImage}
                width={socialFormats[selectedFormat].width}
                height={socialFormats[selectedFormat].height}
                crop="fill"
                gravity="auto" // AI cropping to keep subjects centered
                alt={`Preview for ${selectedFormat}`}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="max-w-full max-h-150 object-contain shadow-lg border border-gray-300"
                ref={imageRef}
                onLoad={() => setIsTransforming(false)} // Clear loading state when done
              />
            </div>
          ) : (
            /* Empty State */
            <div className="text-gray-400 flex flex-col items-center">
              <svg
                className="w-16 h-16 mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <p className="text-lg font-medium text-gray-500">
                No Image Selected
              </p>
              <p className="text-sm mt-1">Upload a file to see the preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
