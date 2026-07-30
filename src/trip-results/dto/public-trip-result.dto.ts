import { TripResult } from '../trip-result.entity';

export class TripResultPhotoDto {
  id: string;
  url: string;
  sortOrder: number;
}

export class PublicTripResultDto {
  id: string;
  date: string;
  departureCity: string;
  arrivalCity: string;
  photos: TripResultPhotoDto[];
  photoCount: number;
  coverPhotoUrl: string | null;

  static from(result: TripResult): PublicTripResultDto {
    const photos = [...(result.photos ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
      .map((photo) => ({
        id: photo.id,
        url: photo.url,
        sortOrder: photo.sortOrder,
      }));

    const dto = new PublicTripResultDto();
    dto.id = result.id;
    dto.date = result.date;
    dto.departureCity = result.departureCity;
    dto.arrivalCity = result.arrivalCity;
    dto.photos = photos;
    dto.photoCount = photos.length;
    dto.coverPhotoUrl = photos[0]?.url ?? null;
    return dto;
  }
}
