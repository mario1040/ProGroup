import { describe, it, expect } from 'vitest';
import { TaskInstance } from '../types';

describe('Naris Ops Core Business Logic & KPI Rules', () => {
  const sampleTasks: TaskInstance[] = [
    {
      id: 'task_1',
      zone_id: 'z_reception',
      assigned_to: 'p2',
      task_type: 'recurring',
      title: 'تنظيف الاستقبال',
      due_date: '2026-08-16',
      due_time: '09:00',
      status: 'completed',
      supervisor_approved: true,
      supervisor_approved_by: 'p1',
      started_at: '2026-08-16T09:05:00.000Z',
      completed_at: '2026-08-16T09:25:00.000Z',
      delay_minutes: 0,
      quality_grade: 'A',
      photo_before_url: 'https://res.cloudinary.com/test/before1.jpg',
      photo_after_url: 'https://res.cloudinary.com/test/after1.jpg'
    },
    {
      id: 'task_2',
      zone_id: 'z_bathrooms',
      assigned_to: 'p2',
      task_type: 'recurring',
      title: 'تطهير دورة المياه',
      due_date: '2026-08-16',
      due_time: '11:00',
      status: 'completed',
      supervisor_approved: true,
      supervisor_approved_by: 'p1',
      started_at: '2026-08-16T11:30:00.000Z',
      completed_at: '2026-08-16T12:00:00.000Z',
      delay_minutes: 30, // Late
      quality_grade: 'B',
      photo_before_url: 'https://res.cloudinary.com/test/before2.jpg',
      photo_after_url: 'https://res.cloudinary.com/test/after2.jpg'
    },
    {
      id: 'task_3',
      zone_id: 'z_kitchen',
      assigned_to: 'p3',
      task_type: 'recurring',
      title: 'تنظيف البوفيه',
      due_date: '2026-08-16',
      due_time: '14:00',
      status: 'pending',
      supervisor_approved: false
    }
  ];

  it('correctly calculates completed, late, and pending task statistics', () => {
    const statsCompleted = sampleTasks.filter(t => t.status === 'completed').length;
    const statsPending = sampleTasks.filter(t => t.status === 'pending').length;
    const statsLate = sampleTasks.filter(t => t.status === 'late' || (t.status === 'completed' && (t.delay_minutes || 0) > 0)).length;

    expect(statsCompleted).toBe(2);
    expect(statsPending).toBe(1);
    expect(statsLate).toBe(1);
  });

  it('computes compliance rate accurately', () => {
    const totalAssigned = sampleTasks.length;
    const completedOnTime = sampleTasks.filter(t => t.status === 'completed' && (!t.delay_minutes || t.delay_minutes <= 0)).length;
    
    const complianceRate = totalAssigned > 0 ? Math.round((completedOnTime / totalAssigned) * 100) : 0;
    // 1 on-time out of 3 total = 33%
    expect(complianceRate).toBe(33);
  });

  it('validates photo evidence requirements on completed tasks', () => {
    const validTask = sampleTasks[0];
    const isPhotoValid = Boolean(
      validTask.photo_before_url?.startsWith('http') && 
      validTask.photo_after_url?.startsWith('http')
    );
    expect(isPhotoValid).toBe(true);

    const pendingTask = sampleTasks[2];
    const isPendingPhotoValid = Boolean(
      pendingTask.photo_before_url?.startsWith('http') && 
      pendingTask.photo_after_url?.startsWith('http')
    );
    expect(isPendingPhotoValid).toBe(false);
  });

  it('computes average task execution time in minutes', () => {
    const completedTasksWithTimes = sampleTasks.filter(t => t.started_at && t.completed_at);
    const totalMinutes = completedTasksWithTimes.reduce((acc, t) => {
      const start = new Date(t.started_at!).getTime();
      const end = new Date(t.completed_at!).getTime();
      return acc + (end - start) / (1000 * 60);
    }, 0);

    const avgMinutes = completedTasksWithTimes.length > 0 
      ? Math.round(totalMinutes / completedTasksWithTimes.length) 
      : 0;

    // Task 1: 20 min (9:05 -> 9:25), Task 2: 30 min (11:30 -> 12:00) -> Avg = 25 min
    expect(avgMinutes).toBe(25);
  });
});
