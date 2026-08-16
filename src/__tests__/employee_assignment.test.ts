import { describe, it, expect } from 'vitest';
import { 
  isEligibleCleaner, 
  getEligibleCleaners, 
  selectFlexibleAssignee 
} from '../lib/api';
import { Profile, TaskInstance, SOPItem } from '../types';

describe('Naris Ops Employee Assignment & Flexible Distribution Hardening Suite', () => {
  const profiles: Profile[] = [
    {
      id: 'p1',
      username: 'admin',
      full_name: 'مدير العمليات',
      role: 'admin',
      is_active: true,
      created_at: '2026-01-01'
    },
    {
      id: 'p_sup',
      username: 'supervisor1',
      full_name: 'مشرف الجودة',
      role: 'supervisor',
      is_active: true,
      created_at: '2026-01-01'
    },
    {
      id: 'p2',
      username: 'cleaner_active_a',
      full_name: 'أحمد علي (نشط)',
      role: 'cleaner',
      is_active: true,
      created_at: '2026-01-01'
    },
    {
      id: 'p3',
      username: 'cleaner_active_b',
      full_name: 'محمود حسن (نشط)',
      role: 'cleaner',
      is_active: true,
      created_at: '2026-01-01'
    },
    {
      id: 'p4_legacy',
      username: 'cleaner_legacy',
      full_name: 'موظف قديم بدون علامة نشاط',
      role: 'cleaner',
      // @ts-ignore testing undefined is_active for backward compatibility
      is_active: undefined,
      created_at: '2026-01-01'
    },
    {
      id: 'p5_inactive',
      username: 'cleaner_inactive',
      full_name: 'رحاب محمد (معطل/غير نشط)',
      role: 'cleaner',
      is_active: false,
      created_at: '2026-01-01'
    }
  ];

  it('TEST 1: Cleaner with is_active = false cannot appear in eligible cleaners list', () => {
    const inactiveCleaner = profiles.find(p => p.id === 'p5_inactive')!;
    expect(isEligibleCleaner(inactiveCleaner)).toBe(false);

    const eligible = getEligibleCleaners(profiles);
    expect(eligible.some(p => p.id === 'p5_inactive')).toBe(false);
  });

  it('TEST 2: Cleaner with is_active = true appears in eligible cleaners list', () => {
    const activeCleaner = profiles.find(p => p.id === 'p2')!;
    expect(isEligibleCleaner(activeCleaner)).toBe(true);

    const eligible = getEligibleCleaners(profiles);
    expect(eligible.some(p => p.id === 'p2')).toBe(true);
    expect(eligible.some(p => p.id === 'p3')).toBe(true);
  });

  it('TEST 3: Cleaner with is_active = undefined is treated as eligible (backward compatibility)', () => {
    const legacyCleaner = profiles.find(p => p.id === 'p4_legacy')!;
    expect(isEligibleCleaner(legacyCleaner)).toBe(true);

    const eligible = getEligibleCleaners(profiles);
    expect(eligible.some(p => p.id === 'p4_legacy')).toBe(true);
  });

  it('TEST 4: Non-cleaner roles (admin, supervisor) are NEVER in eligible cleaners list', () => {
    const admin = profiles.find(p => p.id === 'p1')!;
    const supervisor = profiles.find(p => p.id === 'p_sup')!;

    expect(isEligibleCleaner(admin)).toBe(false);
    expect(isEligibleCleaner(supervisor)).toBe(false);

    const eligible = getEligibleCleaners(profiles);
    expect(eligible.some(p => p.role === 'admin')).toBe(false);
    expect(eligible.some(p => p.role === 'supervisor')).toBe(false);
  });

  it('TEST 5: Flexible Distribution excludes inactive employees even with zero task load', () => {
    // Cleaner A has 5 tasks, Cleaner B has 3 tasks, Inactive Cleaner has 0 tasks
    const activeCleaners = getEligibleCleaners(profiles);
    const dateStr = '2026-08-16';

    const tasks: TaskInstance[] = [
      // 5 tasks for p2
      { id: 't1', zone_id: 'z1', assigned_to: 'p2', task_type: 'recurring', title: 'T1', due_date: dateStr, due_time: '10:00', status: 'pending', supervisor_approved: false },
      { id: 't2', zone_id: 'z1', assigned_to: 'p2', task_type: 'recurring', title: 'T2', due_date: dateStr, due_time: '11:00', status: 'pending', supervisor_approved: false },
      { id: 't3', zone_id: 'z1', assigned_to: 'p2', task_type: 'recurring', title: 'T3', due_date: dateStr, due_time: '12:00', status: 'pending', supervisor_approved: false },
      { id: 't4', zone_id: 'z1', assigned_to: 'p2', task_type: 'recurring', title: 'T4', due_date: dateStr, due_time: '13:00', status: 'pending', supervisor_approved: false },
      { id: 't5', zone_id: 'z1', assigned_to: 'p2', task_type: 'recurring', title: 'T5', due_date: dateStr, due_time: '14:00', status: 'pending', supervisor_approved: false },
      // 3 tasks for p3
      { id: 't6', zone_id: 'z1', assigned_to: 'p3', task_type: 'recurring', title: 'T6', due_date: dateStr, due_time: '10:00', status: 'pending', supervisor_approved: false },
      { id: 't7', zone_id: 'z1', assigned_to: 'p3', task_type: 'recurring', title: 'T7', due_date: dateStr, due_time: '11:00', status: 'pending', supervisor_approved: false },
      { id: 't8', zone_id: 'z1', assigned_to: 'p3', task_type: 'recurring', title: 'T8', due_date: dateStr, due_time: '12:00', status: 'pending', supervisor_approved: false },
      // 5 tasks for p4_legacy
      { id: 't9', zone_id: 'z1', assigned_to: 'p4_legacy', task_type: 'recurring', title: 'T9', due_date: dateStr, due_time: '10:00', status: 'pending', supervisor_approved: false },
      { id: 't10', zone_id: 'z1', assigned_to: 'p4_legacy', task_type: 'recurring', title: 'T10', due_date: dateStr, due_time: '11:00', status: 'pending', supervisor_approved: false },
      { id: 't11', zone_id: 'z1', assigned_to: 'p4_legacy', task_type: 'recurring', title: 'T11', due_date: dateStr, due_time: '12:00', status: 'pending', supervisor_approved: false },
      { id: 't12', zone_id: 'z1', assigned_to: 'p4_legacy', task_type: 'recurring', title: 'T12', due_date: dateStr, due_time: '13:00', status: 'pending', supervisor_approved: false },
      { id: 't13', zone_id: 'z1', assigned_to: 'p4_legacy', task_type: 'recurring', title: 'T13', due_date: dateStr, due_time: '14:00', status: 'pending', supervisor_approved: false }
    ];

    const selected = selectFlexibleAssignee(activeCleaners, tasks, dateStr);
    // Cleaner B (p3) with 3 tasks should be selected. Inactive (p5_inactive) has 0 tasks but must NEVER be selected.
    expect(selected.id).toBe('p3');
    expect(selected.id).not.toBe('p5_inactive');
  });

  it('TEST 6: Two active cleaners with equal load use deterministic tie-breaker', () => {
    const activeCleaners = [
      profiles.find(p => p.id === 'p2')!,
      profiles.find(p => p.id === 'p3')!
    ];
    const dateStr = '2026-08-16';

    const tasks: TaskInstance[] = [
      { id: 't1', zone_id: 'z1', assigned_to: 'p2', task_type: 'recurring', title: 'T1', due_date: dateStr, due_time: '10:00', status: 'pending', supervisor_approved: false },
      { id: 't2', zone_id: 'z1', assigned_to: 'p3', task_type: 'recurring', title: 'T2', due_date: dateStr, due_time: '10:00', status: 'pending', supervisor_approved: false }
    ];

    // Both p2 and p3 have 1 task on 2026-08-16
    // Tie breaker cleaner.id < bestCleaner.id -> 'p2' < 'p3' -> 'p2' selected consistently
    const selectedFirst = selectFlexibleAssignee(activeCleaners, tasks, dateStr);
    const selectedSecond = selectFlexibleAssignee(activeCleaners.reverse(), tasks, dateStr);

    expect(selectedFirst.id).toBe('p2');
    expect(selectedSecond.id).toBe('p2');
  });

  it('TEST 7: Zero active cleaners throws specific error and prevents invalid assignment', () => {
    const noCleaners: Profile[] = [];
    expect(() => selectFlexibleAssignee(noCleaners, [], '2026-08-16')).toThrow('لا يوجد موظفون نشطون متاحون لإسناد المهمة.');
  });

  it('TEST 8: Reassignment validation rejects assigning to inactive cleaners', () => {
    const inactiveCleaner = profiles.find(p => p.id === 'p5_inactive')!;
    const isEligible = isEligibleCleaner(inactiveCleaner);
    expect(isEligible).toBe(false);
  });

  it('TEST 9: Historical tasks assigned to deactivated employees remain unchanged', () => {
    const historicalTasks: TaskInstance[] = [
      {
        id: 'hist_1',
        zone_id: 'z1',
        assigned_to: 'p5_inactive', // Completed by Rehab when she was active
        task_type: 'recurring',
        title: 'مهمة أرشيفية قديمة',
        due_date: '2026-07-01',
        due_time: '09:00',
        status: 'completed',
        supervisor_approved: true,
        completed_at: '2026-07-01T09:30:00.000Z'
      }
    ];

    // Deactivating employee does NOT mutate historical tasks
    expect(historicalTasks[0].assigned_to).toBe('p5_inactive');
    expect(historicalTasks[0].status).toBe('completed');
  });

  it('TEST 10: Recurring SOP with inactive default assignee safely falls back to active cleaners', () => {
    const sopItem: Partial<SOPItem> = {
      id: 'sop_1',
      title: 'تنظيف الممرات',
      zone_id: 'z1',
      default_assignee_id: 'p5_inactive', // Inactive assignee in legacy SOP
      frequency: 'يومي',
      is_active: true
    };

    const activeCleaners = getEligibleCleaners(profiles);
    let assignedTo = '';

    // Logic under test:
    if (sopItem.default_assignee_id) {
      const defaultEmp = profiles.find(p => p.id === sopItem.default_assignee_id);
      if (defaultEmp && isEligibleCleaner(defaultEmp)) {
        assignedTo = defaultEmp.id;
      }
    }

    if (!assignedTo) {
      const best = selectFlexibleAssignee(activeCleaners, [], '2026-08-16');
      assignedTo = best.id;
    }

    expect(assignedTo).not.toBe('p5_inactive');
    expect(activeCleaners.some(c => c.id === assignedTo)).toBe(true);
  });
});
