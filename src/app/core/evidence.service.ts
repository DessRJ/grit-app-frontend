import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { EvidenceRecord } from './models';
import { uid } from './util';

/** Reduce una imagen a JPEG máx. 1280 px para no saturar el almacenamiento local */
export async function compressImage(file: File, maxSide = 1280, quality = 0.82): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    return blob ?? file;
  } catch {
    return file;
  }
}

@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private db = inject(DbService);

  async save(userId: string, challengeId: string, file: Blob, name: string, opts: { code?: string; takenAt?: number } = {}): Promise<string> {
    const isImage = file.type.startsWith('image/');
    const blob = isImage ? await compressImage(file as File) : file;
    const rec: EvidenceRecord = {
      id: uid(),
      userId,
      challengeId,
      kind: isImage ? 'photo' : 'file',
      name,
      mime: blob.type || file.type,
      blob,
      code: opts.code,
      takenAt: opts.takenAt ?? Date.now(),
    };
    await this.db.put('evidence', rec);
    return rec.id;
  }

  get(id: string): Promise<EvidenceRecord | undefined> {
    return this.db.get<EvidenceRecord>('evidence', id);
  }

  async list(userId: string): Promise<EvidenceRecord[]> {
    return this.db.getAllByUser<EvidenceRecord>('evidence', userId);
  }

  async remove(id: string): Promise<void> {
    await this.db.delete('evidence', id);
  }
}
