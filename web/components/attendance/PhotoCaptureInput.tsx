import { Camera, RotateCcw, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface PhotoCaptureInputProps {
  value: File | null;
  onChange: (file: File | null) => void;
  employeeLabel?: string;
  required?: boolean;
}

export const PhotoCaptureInput: React.FC<PhotoCaptureInputProps> = ({
  value,
  onChange,
  employeeLabel,
}) => {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(value);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    setLocalError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Browser tidak mendukung akses kamera langsung. Gunakan tab Upload File.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(
        'Izin kamera ditolak atau perangkat kamera tidak ditemukan. Silakan gunakan tab Upload File.',
      );
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const handleSwitchMode = (target: 'upload' | 'camera') => {
    setMode(target);
    setLocalError(null);
    if (target === 'camera' && !value) {
      startCamera();
    } else {
      stopCamera();
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 960;
    const height = video.videoHeight || 600;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    // Tambahkan watermark waktu pengambilan foto di bagian bawah
    const stampTime = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'Asia/Jakarta',
    }).format(new Date());

    ctx.fillStyle = 'rgba(17, 24, 39, 0.78)';
    ctx.fillRect(0, height - 44, width, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px Inter, Arial, sans-serif';
    const text = employeeLabel
      ? `${employeeLabel}  |  ${stampTime} WIB`
      : `Presensi WFH  |  ${stampTime} WIB`;
    ctx.fillText(text, 16, height - 16);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `wfh-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        stopCamera();
        onChange(capturedFile);
      },
      'image/jpeg',
      0.88,
    );
  };

  const validateAndSelectFile = (file?: File) => {
    setLocalError(null);
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
      setLocalError('Format file harus berupa JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLocalError('Ukuran file maksimal 5 MB.');
      return;
    }

    onChange(file);
  };

  const handleReset = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (mode === 'camera') {
      startCamera();
    }
  };

  return (
    <div className="capture-box">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div className="capture-tabs">
          <button
            type="button"
            className={`capture-tab ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('upload')}
          >
            <Upload size={14} />
            Upload File Foto
          </button>
          <button
            type="button"
            className={`capture-tab ${mode === 'camera' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('camera')}
          >
            <Camera size={14} />
            Ambil dari Kamera
          </button>
        </div>

        {value && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
          >
            <RotateCcw size={13} />
            Ganti Foto
          </button>
        )}
      </div>

      {localError && <div className="alert alert-error">{localError}</div>}

      {previewUrl ? (
        <div>
          <div className="camera-viewport">
            <img src={previewUrl} alt="Preview bukti WFH" />
          </div>
          <div
            style={{
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>File: {value?.name}</span>
            <span>{value ? `${(value.size / 1024).toFixed(0)} KB` : ''}</span>
          </div>
        </div>
      ) : mode === 'camera' ? (
        <div>
          {cameraError ? (
            <div className="alert alert-error" style={{ marginBottom: 0 }}>
              {cameraError}
            </div>
          ) : (
            <>
              <div className="camera-viewport">
                <video ref={videoRef} autoPlay playsInline muted />
              </div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={captureSnapshot}
                  disabled={!cameraActive}
                >
                  <Camera size={15} />
                  Ambil Foto Sekarang
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          className="upload-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = e.dataTransfer.files?.[0];
            validateAndSelectFile(dropped);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => validateAndSelectFile(e.target.files?.[0])}
          />
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
            Klik untuk memilih foto atau tarik file gambar ke area ini
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Format JPG, PNG, atau WEBP (maksimal 5 MB) sebagai bukti sedang bekerja dari rumah
          </div>
        </div>
      )}
    </div>
  );
};

