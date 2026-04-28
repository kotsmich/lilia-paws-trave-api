import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

export const dogPhotoStorage = diskStorage({
  destination: './uploads/dogs/photos',
  filename: (_req, file, cb) => {
    const uniqueName = `${randomUUID()}-${Date.now()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const dogDocumentStorage = diskStorage({
  destination: './uploads/dogs/documents',
  filename: (_req, file, cb) => {
    const uniqueName = `${randomUUID()}-${Date.now()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const dogTempStorage = diskStorage({
  destination: './uploads/dogs/temp',
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname)}`);
  },
});

export const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (!file.mimetype.match(/^image\/(jpg|jpeg|png|webp)$/)) {
    return cb(new BadRequestException('Only image files allowed (jpg, jpeg, png, webp)'), false);
  }
  cb(null, true);
};

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.jpg', '.jpeg', '.png',
  '.doc', '.docx',
  '.odt',
  '.rtf',
  '.txt',
]);

export const documentFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
  // Browsers report inconsistent MIME types for office formats (.odt often arrives
  // as application/octet-stream), so authoritative check is by file extension.
  const ext = extname(file.originalname).toLowerCase();
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    return cb(new BadRequestException('Unsupported document format'), false);
  }
  cb(null, true);
};
