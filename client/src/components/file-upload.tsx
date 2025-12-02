import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import type { Trade, UploadResponse } from "@shared/schema";

interface FileUploadProps {
  onDataUpload: (trades: Trade[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  variant?: "default" | "large";
}

async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload file");
  }

  return response.json();
}

export function FileUpload({ onDataUpload, isLoading, setIsLoading, variant = "default" }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: (data) => {
      onDataUpload(data.trades);
      toast({
        title: "File uploaded successfully",
        description: `Loaded ${data.trades.length} trade records`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setFileName(null);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    uploadMutation.mutate(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so the same file can be uploaded again
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const isPending = uploadMutation.isPending || isLoading;

  if (variant === "large") {
    return (
      <div
        className={`
          relative w-full max-w-md border-2 border-dashed rounded-md p-8
          transition-colors cursor-pointer
          ${dragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        data-testid="dropzone-upload"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleChange}
          className="hidden"
          data-testid="input-file-dropzone"
        />
        <div className="flex flex-col items-center gap-3 text-center">
          {isPending ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground" data-testid="text-upload-progress">
                Processing {fileName}...
              </p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground" data-testid="text-dropzone-instructions">
                  Drop your Excel file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1" data-testid="text-dropzone-formats">
                  Supports .xlsx and .xls files
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleChange}
        className="hidden"
        data-testid="input-file-header"
      />
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant="default"
        size="default"
        data-testid="button-upload"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Excel
          </>
        )}
      </Button>
    </>
  );
}
