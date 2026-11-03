import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export const attendanceUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const dest = path.resolve(process.cwd(), 'uploads', 'attendance');
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req: any, file, cb) => {
      const userId = req?.user?.sub || 'emp';
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
      const rand = Math.random().toString(36).slice(2, 8);
      cb(null, `wfh-${userId}-${Date.now()}-${rand}${safeExt}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5 MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isImageMime = /^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype);
    if (!isImageMime || (ext && !ALLOWED_EXTENSIONS.has(ext))) {
      return cb(
        new BadRequestException(
          'Format foto tidak didukung. Gunakan file JPG, PNG, atau WEBP (maks. 5 MB).',
        ),
        false,
      );
    }
    cb(null, true);
  },
};

