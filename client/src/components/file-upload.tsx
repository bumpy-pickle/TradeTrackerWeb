import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2, ClipboardPaste } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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

async function parsePastedData(text: string): Promise<UploadResponse> {
  const response = await fetch("/api/parse-paste", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to parse pasted data");
  }

  return response.json();
}

export function FileUpload({ onDataUpload, isLoading, setIsLoading, variant = "default" }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
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

  const pasteMutation = useMutation({
    mutationFn: parsePastedData,
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: (data) => {
      onDataUpload(data.trades);
      toast({
        title: "Data imported successfully",
        description: `Loaded ${data.trades.length} trade records from pasted data`,
      });
      setPasteDialogOpen(false);
      setPastedText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
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

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      toast({
        title: "No data",
        description: "Please paste some data first",
        variant: "destructive",
      });
      return;
    }
    pasteMutation.mutate(pastedText);
  };

  const isPending = uploadMutation.isPending || pasteMutation.isPending || isLoading;

  if (variant === "large") {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
        {/* Primary action: Paste Data */}
        <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="lg" 
              disabled={isPending} 
              className="w-full"
              data-testid="button-paste-large"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ClipboardPaste className="w-5 h-5 mr-2" />
                  Paste Data
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Paste Data</DialogTitle>
              <DialogDescription>
                Copy rows from your data source and paste them below. Data is read from fixed columns: E (Person 1), F (Date), G (Start Time), H (End Time), K (Person 2).
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Paste your data here...&#10;&#10;Copy the data from your source (including all columns) and paste here.&#10;The system will read from columns E, F, G, H, and K automatically."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              data-testid="textarea-paste"
            />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setPasteDialogOpen(false);
                  setPastedText("");
                }}
                data-testid="button-cancel-paste"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePasteSubmit}
                disabled={pasteMutation.isPending || !pastedText.trim()}
                data-testid="button-submit-paste"
              >
                {pasteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Import Data"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground w-full">
          <div className="h-px flex-1 bg-border" />
          <span>or upload a file</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        {/* Secondary action: File upload dropzone */}
        <div
          className={`
            relative w-full border-2 border-dashed rounded-md p-6
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
          <div className="flex flex-col items-center gap-2 text-center">
            <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground" data-testid="text-dropzone-instructions">
                Drop Excel file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1" data-testid="text-dropzone-formats">
                Supports .xlsx and .xls files
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
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
            Processing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Excel
          </>
        )}
      </Button>
      
      <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={isPending} data-testid="button-paste">
            <ClipboardPaste className="w-4 h-4 mr-2" />
            Paste
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Paste Excel Data</DialogTitle>
            <DialogDescription>
              Copy rows from Excel and paste them below. Data is read from fixed columns: E (Person 1), F (Date), G (Start Time), H (End Time), K (Person 2).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Paste your Excel data here...&#10;&#10;Select columns A through K (or more) in Excel, copy, and paste here.&#10;The system will read from columns E, F, G, H, and K automatically."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            data-testid="textarea-paste-header"
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPasteDialogOpen(false);
                setPastedText("");
              }}
              data-testid="button-cancel-paste-header"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePasteSubmit}
              disabled={pasteMutation.isPending || !pastedText.trim()}
              data-testid="button-submit-paste-header"
            >
              {pasteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Import Data"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
