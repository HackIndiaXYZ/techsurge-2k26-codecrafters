import { useState } from 'react';
import { apiClient } from '../lib/apiClient';

const getNeutralReason = (reason) => {
  if (reason === 'SUSPECTED_IMPERSONATION') return 'Potential identity verification mismatch';
  if (reason === 'REVIEW_REQUIRED') return 'Verification review required';
  return reason || 'Unknown reason';
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'OPEN': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'UNDER_REVIEW': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getReferralBadgeColor = (status) => {
  switch (status) {
    case 'NOT_REFERRED': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'PENDING_AUTHORIZATION': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'REFERRED_TO_LE': return 'bg-red-100 text-red-800 border-red-200';
    case 'ACKNOWLEDGED': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getNeutralReferralText = (status) => {
  if (status === 'REFERRED_TO_LE') return 'Referral authorized';
  if (status === 'NOT_REFERRED') return 'Not referred';
  if (status === 'PENDING_AUTHORIZATION') return 'Pending authorization';
  if (status === 'ACKNOWLEDGED') return 'Acknowledged';
  if (status === 'CLOSED') return 'Closed';
  return status;
};

export default function InvestigationCaseCard({ caseData, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleAction = async (action) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await apiClient.updateInvestigation(caseData.caseId, action);
      setSuccessMsg(`Case successfully updated to ${response.investigation?.status || 'new status'}`);
      // Callback to parent to update the list with the exact backend response
      if (onUpdate && response.investigation) {
        onUpdate(response.investigation);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const {
    caseId,
    transactionRef,
    reason,
    status,
    referralStatus,
    evidenceRefs = [],
    createdAt,
    reviewedAt
  } = caseData;

  const isClosed = status === 'CLOSED';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-800 font-mono">{caseId}</h3>
          <p className="text-xs text-gray-500 font-mono mt-1">Transaction: {transactionRef}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${getStatusBadgeColor(status)}`}>
            Status: {status}
          </span>
          <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${getReferralBadgeColor(referralStatus)}`}>
            Referral: {getNeutralReferralText(referralStatus)}
          </span>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-amber-50 border border-amber-100 rounded p-3 text-sm text-amber-900 font-medium">
        {getNeutralReason(reason)}
      </div>

      {/* Evidence */}
      <div className="bg-gray-50 border border-gray-100 rounded p-3">
        <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Verification Event References</h4>
        {evidenceRefs.length > 0 ? (
          <ul className="list-disc list-inside text-xs text-gray-700 font-mono space-y-1">
            {evidenceRefs.map((ref, i) => (
              <li key={i}>{ref}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic">No references attached.</p>
        )}
      </div>

      {/* Timestamps */}
      <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
        <div>
          <span className="font-semibold">Created: </span>
          {new Date(createdAt).toLocaleString()}
        </div>
        {reviewedAt && (
          <div>
            <span className="font-semibold">Reviewed: </span>
            {new Date(reviewedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-2 rounded border border-red-200">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 text-xs p-2 rounded border border-emerald-200">
          {successMsg}
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
        {status === 'OPEN' && (
          <button 
            disabled={loading}
            onClick={() => handleAction('START_REVIEW')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm disabled:opacity-50 transition"
          >
            Start Review
          </button>
        )}

        {status === 'UNDER_REVIEW' && referralStatus === 'NOT_REFERRED' && (
          <button 
            disabled={loading}
            onClick={() => handleAction('REQUEST_AUTHORIZATION')}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded shadow-sm disabled:opacity-50 transition"
          >
            Request Referral Authorization
          </button>
        )}

        {referralStatus === 'PENDING_AUTHORIZATION' && (
          <button 
            disabled={loading}
            onClick={() => handleAction('AUTHORIZE_REFERRAL')}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm disabled:opacity-50 transition"
          >
            Authorize Referral
          </button>
        )}

        {referralStatus === 'REFERRED_TO_LE' && (
          <button 
            disabled={loading}
            onClick={() => handleAction('ACKNOWLEDGE_REFERRAL')}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-4 rounded shadow-sm disabled:opacity-50 transition"
          >
            Acknowledge Referral
          </button>
        )}

        {!isClosed && (
          <button 
            disabled={loading}
            onClick={() => handleAction('CLOSE_CASE')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold py-2 px-4 rounded shadow-sm disabled:opacity-50 transition ml-auto"
          >
            Close Case
          </button>
        )}
        {isClosed && (
          <span className="text-xs text-gray-400 italic font-medium ml-auto self-center">Case Closed</span>
        )}
      </div>
    </div>
  );
}
