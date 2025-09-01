import { FileIcon, Download, Image as ImageIcon, FileText, FileSpreadsheet, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FileAttachment {
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadDate: string;
}

interface FilePreviewProps {
  file: FileAttachment;
  className?: string;
}

export function FilePreview({ file, className }: FilePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (mimetype.includes('text') || mimetype.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const canPreview = (mimetype: string) => {
    return mimetype.startsWith('image/') || 
           mimetype.startsWith('text/') || 
           mimetype === 'application/pdf';
  };

  const getFileUrl = () => `/api/files/${file.filename}`;

  return (
    <div className={`file-preview border rounded-lg p-3 bg-gray-50 dark:bg-gray-100 max-w-sm ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {getFileIcon(file.mimetype)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-800" title={file.originalName}>
            {file.originalName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-600">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      
      {file.mimetype.startsWith('image/') && (
        <div className="mb-2">
          <img 
            src={getFileUrl()} 
            alt={file.originalName}
            className="max-w-full h-auto rounded border max-h-48 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="flex gap-2">
        {canPreview(file.mimetype) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getFileUrl(), '_blank')}
            className="text-xs"
            data-testid="button-preview-file"
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const link = document.createElement('a');
            link.href = getFileUrl();
            link.download = file.originalName;
            link.click();
          }}
          className="text-xs"
          data-testid="button-download-file"
        >
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      </div>
    </div>
  );
}