import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join, basename } from 'path';
import { TripResult } from './trip-result.entity';
import { TripResultPhoto } from './trip-result-photo.entity';
import { CreateTripResultDto } from './dto/create-trip-result.dto';
import { UpdateTripResultDto } from './dto/update-trip-result.dto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'trip-results');

@Injectable()
export class TripResultsService {
  private readonly logger = new Logger(TripResultsService.name);

  constructor(
    @InjectRepository(TripResult) private repo: Repository<TripResult>,
    @InjectRepository(TripResultPhoto)
    private photoRepo: Repository<TripResultPhoto>,
  ) {}

  /** Newest trip first — the public page reads as a reverse-chronological feed. */
  findAll(): Promise<TripResult[]> {
    return this.repo.find({ order: { date: 'DESC' } });
  }

  async findOne(id: string): Promise<TripResult> {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) throw new NotFoundException('Trip result not found');
    return result;
  }

  async create(data: CreateTripResultDto): Promise<TripResult> {
    const result = this.repo.create({ ...data, photos: [] });
    return this.repo.save(result);
  }

  async update(id: string, data: UpdateTripResultDto): Promise<TripResult> {
    const result = await this.findOne(id);
    Object.assign(result, data);
    await this.repo.save(result);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.findOne(id);
    await Promise.all(
      (result.photos ?? []).map((photo) => this.deleteFile(photo.url)),
    );
    await this.repo.remove(result);
  }

  /** Append uploaded photos, keeping existing sort order intact. */
  async addPhotos(id: string, urls: string[]): Promise<TripResult> {
    const result = await this.findOne(id);
    const nextOrder =
      (result.photos ?? []).reduce((max, p) => Math.max(max, p.sortOrder), -1) +
      1;

    await this.photoRepo.save(
      urls.map((url, index) =>
        this.photoRepo.create({
          url,
          sortOrder: nextOrder + index,
          tripResultId: id,
        }),
      ),
    );
    return this.findOne(id);
  }

  async removePhoto(id: string, photoId: string): Promise<TripResult> {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId, tripResultId: id },
    });
    if (!photo) throw new NotFoundException('Photo not found');
    await this.photoRepo.remove(photo);
    await this.deleteFile(photo.url);
    return this.findOne(id);
  }

  /** Best-effort removal of the file on disk; a missing file must not fail the request. */
  private async deleteFile(url: string): Promise<void> {
    try {
      await unlink(join(UPLOAD_DIR, basename(url)));
    } catch (error) {
      this.logger.warn(
        `Could not delete trip result photo ${url}: ${(error as Error).message}`,
      );
    }
  }
}
