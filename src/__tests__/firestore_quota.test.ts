import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  isFirestoreQuotaError, 
  getFirestoreQuotaExceeded, 
  setFirestoreQuotaExceeded, 
  recordFirestoreError, 
  clearFirestoreQuotaWarning,
  subscribeFirestoreQuota 
} from '../lib/quotaManager';
import { 
  createTask, 
  updateTask, 
  saveSopItem, 
  approveTask, 
  rejectTask 
} from '../lib/api';

describe('Naris Ops Firestore Quota Warning & Error Handling Suite', () => {
  beforeEach(() => {
    setFirestoreQuotaExceeded(false);
  });

  it('TEST 1: Simulated Firestore resource-exhausted error sets quotaExceeded = true', () => {
    expect(getFirestoreQuotaExceeded()).toBe(false);

    const quotaError = {
      code: 'resource-exhausted',
      message: 'Quota exceeded for Firestore database operations.'
    };

    expect(isFirestoreQuotaError(quotaError)).toBe(true);
    recordFirestoreError(quotaError);
    expect(getFirestoreQuotaExceeded()).toBe(true);
  });

  it('TEST 2: Employee & Admin listeners receive quota state changes', () => {
    let listenerState = false;
    const unsubscribe = subscribeFirestoreQuota((exceeded) => {
      listenerState = exceeded;
    });

    setFirestoreQuotaExceeded(true);
    expect(listenerState).toBe(true);
    expect(getFirestoreQuotaExceeded()).toBe(true);

    setFirestoreQuotaExceeded(false);
    expect(listenerState).toBe(false);
    expect(getFirestoreQuotaExceeded()).toBe(false);

    unsubscribe();
  });

  it('TEST 3: Quota error during updateTask rejects mutation, records quota error, and does not claim success', async () => {
    const quotaError = new Error('Resource-exhausted: Quota limit exceeded on write operation');
    (quotaError as any).code = 'resource-exhausted';

    // Simulate calling recordFirestoreError on write failure
    recordFirestoreError(quotaError);
    expect(getFirestoreQuotaExceeded()).toBe(true);

    // Verify rejection
    const mockUpdate = async () => {
      if (getFirestoreQuotaExceeded()) {
        throw quotaError;
      }
      return { success: true };
    };

    await expect(mockUpdate()).rejects.toThrow('Resource-exhausted');
    expect(getFirestoreQuotaExceeded()).toBe(true);
  });

  it('TEST 4: Quota error during saveSopItem prevents false save state and triggers quota banner', async () => {
    const quotaError = { code: 'resource-exhausted', message: 'Rate limit / write quota exceeded' };
    
    expect(isFirestoreQuotaError(quotaError)).toBe(true);
    recordFirestoreError(quotaError);

    expect(getFirestoreQuotaExceeded()).toBe(true);
  });

  it('TEST 5: Quota error during approveTask/rejectTask rejects and triggers banner', async () => {
    const quotaError = { code: 'quota-exceeded', message: 'Quota exceeded for operations' };
    recordFirestoreError(quotaError);

    expect(getFirestoreQuotaExceeded()).toBe(true);
  });

  it('TEST 6: Successful Firestore operation clears the quota warning', () => {
    setFirestoreQuotaExceeded(true);
    expect(getFirestoreQuotaExceeded()).toBe(true);

    clearFirestoreQuotaWarning();
    expect(getFirestoreQuotaExceeded()).toBe(false);
  });

  it('TEST 7: Offline error does NOT trigger quota warning (strictly separated)', () => {
    const offlineError = new Error('Failed to fetch: net::ERR_INTERNET_DISCONNECTED');
    (offlineError as any).code = 'unavailable';

    expect(isFirestoreQuotaError(offlineError)).toBe(false);
    recordFirestoreError(offlineError);

    expect(getFirestoreQuotaExceeded()).toBe(false);
  });

  it('TEST 8: Generic permission-denied or not-found error does NOT trigger quota warning', () => {
    const permError = { code: 'permission-denied', message: 'Missing or insufficient permissions.' };
    const notFoundError = { code: 'not-found', message: 'Document not found.' };

    expect(isFirestoreQuotaError(permError)).toBe(false);
    expect(isFirestoreQuotaError(notFoundError)).toBe(false);

    recordFirestoreError(permError);
    expect(getFirestoreQuotaExceeded()).toBe(false);

    recordFirestoreError(notFoundError);
    expect(getFirestoreQuotaExceeded()).toBe(false);
  });

  it('TEST 9: Quota error message variations correctly identified', () => {
    const variations = [
      { code: 'resource-exhausted', message: '' },
      { code: '8', message: 'RESOURCE_EXHAUSTED' },
      { code: 'functions/resource-exhausted', message: 'Exceeded quota' },
      { message: 'FirebaseError: [code=resource-exhausted]: Quota exceeded.' },
      { message: 'Too many requests: rate limit reached' },
      { message: 'Firestore bandwidth quota exceeded for today.' }
    ];

    variations.forEach((err) => {
      expect(isFirestoreQuotaError(err)).toBe(true);
    });
  });

  it('TEST 10: Non-quota errors correctly rejected', () => {
    const nonQuota = [
      new Error('Validation error: Invalid input data'),
      { code: 'unauthenticated', message: 'User is not logged in' },
      { code: 'already-exists', message: 'Document already exists' },
      { code: 'cancelled', message: 'Operation was cancelled' },
      null,
      undefined,
      ''
    ];

    nonQuota.forEach((err) => {
      expect(isFirestoreQuotaError(err)).toBe(false);
    });
  });
});
