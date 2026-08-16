import { describe, it, expect } from 'vitest';
import { 
  recordOrphanCandidate, 
  getOrphanCandidates, 
  getCloudinaryUrl,
  deleteFromCloudinary
} from '../lib/cloudinary';

describe('Cloudinary Orphan Cleanup & URL Generation', () => {
  it('generates transformed Cloudinary URLs correctly', () => {
    const url = getCloudinaryUrl('sample_image', {
      width: 800,
      height: 600,
      quality: 80,
      format: 'webp'
    });

    expect(url).toContain('/image/upload/w_800,h_600,q_80,f_webp/sample_image');
  });

  it('records and retrieves orphan candidates safely', () => {
    const initialCount = getOrphanCandidates().length;
    
    recordOrphanCandidate(
      'naris_ops/task_photos/z1/t1/before_old',
      'https://res.cloudinary.com/kcs6fxei/image/upload/naris_ops/task_photos/z1/t1/before_old.jpg',
      'task-photos/z1/t1',
      'User retook photo before completion'
    );

    const candidates = getOrphanCandidates();
    expect(candidates.length).toBe(initialCount + 1);
    const lastRecord = candidates[candidates.length - 1];
    expect(lastRecord.public_id).toBe('naris_ops/task_photos/z1/t1/before_old');
    expect(lastRecord.reason).toBe('User retook photo before completion');
    expect(lastRecord.timestamp).toBeDefined();
  });

  it('handles delete requests by recording intent without exposing secrets', async () => {
    const initialCount = getOrphanCandidates().length;
    
    await deleteFromCloudinary('naris_ops/task_photos/manual_del_123');

    const candidates = getOrphanCandidates();
    expect(candidates.length).toBe(initialCount + 1);
    const lastRecord = candidates[candidates.length - 1];
    expect(lastRecord.public_id).toBe('naris_ops/task_photos/manual_del_123');
    expect(lastRecord.reason).toBe('User requested photo deletion');
  });
});
