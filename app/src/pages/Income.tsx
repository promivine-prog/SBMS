import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isStale } from '../lib/plan';
import { roundKobo } from '../lib/runway';
import { newId, type IncomeExpectation, type PaymentMethod } from '../store/guest';
import { useGuest } from '../store/useGuestState';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

export default function Income() {
  const { t } = useTranslation();
  const { state, update } = useGuest();
  const [source, setSource] = useState('');
  const [date, setDate] = useState('');
  const [est, setEst] = useState('');
  const [reg, setReg] = useState<IncomeExpectation['regularity']>('variable');
  const [recvFor, setRecvFor] = useState<string | null>(null);
  const [recvAmt, setRecvAmt] = useState('');
  const [recvMethod, setRecvMethod] = useState<PaymentMethod>('cash');
  const [editDateFor, setEditDateFor] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');

  const t0 = today();

  function add() {
    if (!source.trim()) return;
    const e = Number(est);
    update((s) => ({
      ...s,
      incomeExpectations: [
        ...s.incomeExpectations,
        {
          id: newId(),
          source: source.trim(),
          expectedDate: date || undefined,
          estimatedAmount: est !== '' && Number.isFinite(e) && e > 0 ? roundKobo(e) : undefined,
          status: 'expected' as const,
          regularity: reg,
        },
      ],
    }));
    setSource('');
    setDate('');
    setEst('');
  }

  function setStatus(id: string, status: IncomeExpectation['status']) {
    update((s) => ({ ...s, incomeExpectations: s.incomeExpectations.map((x) => (x.id === id ? { ...x, status } : x)) }));
  }

  function recordReceived(id: string) {
    const a = roundKobo(Number(recvAmt));
    if (!Number.isFinite(a) || a <= 0) return;
    update((s) => {
      const exp = s.incomeExpectations.find((x) => x.id === id);
      if (!exp) return s;
      return {
        ...s,
        balance: roundKobo(s.balance + a),
        transactions: [
          ...s.transactions,
          { id: newId(), type: 'income' as const, amount: a, category: 'Income', date: t0, paymentMethod: recvMethod, source: exp.source },
        ],
        incomeExpectations: s.incomeExpectations.map((x) => (x.id === id ? { ...x, status: 'received' as const } : x)),
      };
    });
    setRecvFor(null);
    setRecvAmt('');
  }

  function saveDate(id: string) {
    update((s) => ({
      ...s,
      incomeExpectations: s.incomeExpectations.map((x) => (x.id === id ? { ...x, expectedDate: editDate || undefined, status: 'expected' as const } : x)),
    }));
    setEditDateFor(null);
    setEditDate('');
  }

  const stale = state.incomeExpectations.filter((x) => isStale(x, t0));

  return (
    <section>
      <h1>{t('income.title')}</h1>
      <p><em>{t('income.notBalance')}</em></p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
        <label>{t('income.source')}: <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Allowance" /></label>
        <label>{t('income.expectedDate')}: <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label>{t('income.estimatedAmount')}: <input type="number" min="0" step="0.01" value={est} onChange={(e) => setEst(e.target.value)} /></label>
        <label>{t('income.regularity')}: <select value={reg} onChange={(e) => setReg(e.target.value as typeof reg)}>
          <option value="regular">{t('income.regular')}</option>
          <option value="variable">{t('income.variable')}</option>
          <option value="one-off">{t('income.oneOff')}</option>
        </select></label>
        <button className="small" onClick={add}>{t('income.add')}</button>
      </div>

      {stale.length > 0 && (
        <div className="stale">
          <strong>{t('income.staleTitle')}</strong>
          {stale.map((x) => <p key={x.id}>{x.source}{x.expectedDate ? ` (${x.expectedDate})` : ''}</p>)}
        </div>
      )}

      {state.incomeExpectations.length === 0 && <p>{t('income.none')}</p>}
      <ul>
        {state.incomeExpectations.map((x) => (
          <li key={x.id} style={isStale(x, t0) ? { fontWeight: 'bold' } : undefined}>
            {x.source} · {t(`income.${x.status}`)} · {t(`income.${x.regularity === 'one-off' ? 'oneOff' : x.regularity}`)}
            {x.expectedDate ? ` · ${x.expectedDate}` : ''}{x.estimatedAmount ? ` · ₦${x.estimatedAmount.toLocaleString()}` : ''}
            {x.status === 'expected' && (
              <>
                {' '}<button onClick={() => { setRecvFor(x.id); setRecvAmt(x.estimatedAmount ? String(x.estimatedAmount) : ''); }}>{t('income.markReceived')}</button>
                {' '}<button onClick={() => { setEditDateFor(x.id); setEditDate(x.expectedDate ?? ''); }}>{t('add.edit')}</button>
                {' '}<button onClick={() => setStatus(x.id, 'delayed')}>{t('income.delayed')}</button>
                {' '}<button onClick={() => setStatus(x.id, 'cancelled')}>{t('income.cancelled')}</button>
              </>
            )}
            {x.status === 'delayed' && (
              <>
                {' '}<button onClick={() => { setEditDateFor(x.id); setEditDate(x.expectedDate ?? ''); }}>{t('add.edit')}</button>
                {' '}<button onClick={() => setStatus(x.id, 'cancelled')}>{t('income.cancelled')}</button>
              </>
            )}
            {recvFor === x.id && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <input type="number" min="0" step="0.01" style={{ width: 120 }} placeholder={t('income.actualAmount')} value={recvAmt} onChange={(e) => setRecvAmt(e.target.value)} />
                <select value={recvMethod} onChange={(e) => setRecvMethod(e.target.value as PaymentMethod)}>
                  {(['cash', 'bank', 'mobile', 'other'] as const).map((m) => <option key={m} value={m}>{t(`add.${m}`)}</option>)}
                </select>
                <button className="small" onClick={() => recordReceived(x.id)}>{t('add.save')}</button>
                <button className="small" onClick={() => setRecvFor(null)}>{t('add.cancel')}</button>
              </div>
            )}
            {editDateFor === x.id && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                <button className="small" onClick={() => saveDate(x.id)}>{t('add.save')}</button>
                <button className="small" onClick={() => setEditDateFor(null)}>{t('add.cancel')}</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
