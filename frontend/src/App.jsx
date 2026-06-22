import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Send,
  RefreshCw,
  Play,
  LogOut,
  User,
  Plus,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Building2
} from 'lucide-react';

const DEPARTMENTS = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Finance' },
  { id: 3, name: 'HR' },
  { id: 4, name: 'Operations' }
];

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
};

function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);

  // Business state
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form states
  const [activeAuthTab, setActiveAuthTab] = useState('login');
  const [authData, setAuthData] = useState({
    username: '',
    email: '',
    password: '',
    departmentId: 1
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    vendorName: ''
  });

  // Concurrency Simulation states
  const [simulationType, setSimulationType] = useState('valid'); // 'valid' or 'edge'
  const [simRunning, setSimRunning] = useState(false);
  const [simLogs, setSimLogs] = useState([]);
  const [simProgress, setSimProgress] = useState(0);
  const [autoReset, setAutoReset] = useState(true);

  // Show toast notification
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // Decode token on mount or token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const decoded = decodeToken(token);
      if (decoded) {
        setUser(decoded);
      } else {
        handleLogout();
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setWallet(null);
      setTransactions([]);
    }
  }, [token]);

  // Fetch wallet & transactions
  const fetchWalletAndTransactions = useCallback(async (walletId) => {
    if (!token || !walletId) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch wallet balance
      const walletRes = await fetch(`/api/wallets/${walletId}`, { headers });
      const walletData = await walletRes.json();

      if (walletRes.ok && walletData.success) {
        setWallet(walletData.data);
      } else {
        setError(walletData.message || 'Failed to fetch wallet');
      }

      // Fetch wallet transactions
      const txRes = await fetch(`/api/wallets/${walletId}/transactions`, { headers });
      const txData = await txRes.json();

      if (txRes.ok && txData.success) {
        setTransactions(txData.data);
      }
    } catch (err) {
      setError('Connection error to server');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load dashboard data when user is loaded
  useEffect(() => {
    if (user && user.departmentId) {
      fetchWalletAndTransactions(user.departmentId);
    }
  }, [user, fetchWalletAndTransactions]);

  // Handle Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authData.email, password: authData.password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        showNotification('success', 'Logged in successfully!');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error during login');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', 'Registration successful! Logging you in...');
        // Auto login after registration
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authData.email, password: authData.password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.success) {
          setToken(loginData.token);
        } else {
          setActiveAuthTab('login');
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error during registration');
    } finally {
      setLoading(false);
    }
  };

  // Quick helper to auto-create a user and log in immediately
  const handleQuickRegisterAndLogin = async (deptId, deptName) => {
    setError(null);
    setLoading(true);
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const tempUser = {
      username: `admin_${deptName.toLowerCase()}_${randomSuffix}`,
      email: `${deptName.toLowerCase()}_admin_${randomSuffix}@wallet.com`,
      password: 'password123',
      departmentId: deptId
    };

    try {
      // Register
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempUser)
      });
      const regData = await regRes.json();

      if (regRes.ok && regData.success) {
        // Login
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: tempUser.email, password: tempUser.password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.success) {
          setToken(loginData.token);
          showNotification('success', `Created & logged in as ${tempUser.username}`);
        }
      } else {
        setError(regData.message || 'Failed to auto-register test user');
      }
    } catch (err) {
      setError('Connection error during auto-setup');
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setWallet(null);
    setTransactions([]);
    showNotification('success', 'Logged out.');
  };

  // Handle Single Payment
  const handleSinglePayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || !paymentData.vendorName) {
      showNotification('error', 'Please fill in all payment fields');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/transactions/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          walletId: user.departmentId,
          amount: parseFloat(paymentData.amount),
          vendorName: paymentData.vendorName
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Successfully paid ${paymentData.amount} INR to ${paymentData.vendorName}`);
        setPaymentData({ amount: '', vendorName: '' });
        fetchWalletAndTransactions(user.departmentId);
      } else {
        showNotification('error', data.message || 'Payment failed');
      }
    } catch (err) {
      setError('Connection error during payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle Wallet Reset
  const handleResetWallet = async (resetBalance = 50000) => {
    if (!user || !user.departmentId) return;
    setError(null);
    try {
      const res = await fetch(`/api/wallets/${user.departmentId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ balance: resetBalance })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Reset wallet to ${resetBalance} INR and cleared transactions!`);
        fetchWalletAndTransactions(user.departmentId);
      } else {
        setError(data.message || 'Failed to reset wallet');
      }
    } catch (err) {
      setError('Connection error during wallet reset');
    }
  };

  // Run Concurrency Simulation (Directly triggers simultaneous requests)
  const runSimulation = async () => {
    if (simRunning) return;
    setSimRunning(true);
    setSimLogs([]);
    setSimProgress(0);

    const walletId = user.departmentId;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      if (simulationType === 'valid') {
        // High Volume Valid Case
        if (autoReset) {
          // 1. Reset balance to 50,000 INR
          setSimLogs(prev => [...prev, { type: 'info', text: 'Resetting wallet to 50,000 INR...' }]);
          await fetch(`/api/wallets/${walletId}/reset`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ balance: 50000 })
          });
          await fetchWalletAndTransactions(walletId);
        } else {
          setSimLogs(prev => [...prev, { type: 'info', text: 'Skipping wallet reset. Using current balance...' }]);
        }

        setSimLogs(prev => [...prev, { type: 'info', text: 'Spawning 10 concurrent requests of 500 INR each...' }]);

        const requests = Array.from({ length: 10 }).map((_, i) => {
          return fetch('/api/transactions/pay', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              walletId,
              amount: 500,
              vendorName: `Sim-Vendor-Valid-${i + 1}`
            })
          })
            .then(async (res) => {
              const data = await res.json();
              setSimProgress(p => p + 10);
              if (res.ok && data.success) {
                setSimLogs(prev => [...prev, { type: 'success', text: `Req ${i + 1}: Success (Paid 500 INR)` }]);
              } else {
                setSimLogs(prev => [...prev, { type: 'error', text: `Req ${i + 1}: Failed - ${data.message || 'Error'}` }]);
              }
            })
            .catch(() => {
              setSimProgress(p => p + 10);
              setSimLogs(prev => [...prev, { type: 'error', text: `Req ${i + 1}: Connection Error` }]);
            });
        });

        await Promise.all(requests);
        setSimLogs(prev => [...prev, { type: 'info', text: 'Simulation completed! Syncing dashboard...' }]);

      } else {
        // Insufficient Funds Edge Case
        if (autoReset) {
          // 1. Reset balance to 2,000 INR
          setSimLogs(prev => [...prev, { type: 'info', text: 'Resetting wallet to 2,000 INR...' }]);
          await fetch(`/api/wallets/${walletId}/reset`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ balance: 2000 })
          });
          await fetchWalletAndTransactions(walletId);
        } else {
          setSimLogs(prev => [...prev, { type: 'info', text: 'Skipping wallet reset. Using current balance...' }]);
        }

        setSimLogs(prev => [...prev, { type: 'info', text: 'Spawning 2 concurrent requests of 1,500 INR each...' }]);

        const requests = [
          { name: 'Request A', amount: 1500 },
          { name: 'Request B', amount: 1500 }
        ].map((req, i) => {
          return fetch('/api/transactions/pay', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              walletId,
              amount: req.amount,
              vendorName: `Sim-Vendor-Edge-${req.name}`
            })
          })
            .then(async (res) => {
              const data = await res.json();
              setSimProgress(p => p + 50);
              if (res.ok && data.success) {
                setSimLogs(prev => [...prev, { type: 'success', text: `${req.name}: Success (Paid ${req.amount} INR)` }]);
              } else {
                setSimLogs(prev => [...prev, { type: 'error', text: `${req.name}: Failed - ${data.message || 'Error'}` }]);
              }
            })
            .catch(() => {
              setSimProgress(p => p + 50);
              setSimLogs(prev => [...prev, { type: 'error', text: `${req.name}: Connection Error` }]);
            });
        });

        await Promise.all(requests);
        setSimLogs(prev => [...prev, { type: 'info', text: 'Simulation completed! Syncing dashboard...' }]);
      }

      // Re-fetch ledger and balance
      fetchWalletAndTransactions(walletId);
    } catch (err) {
      setSimLogs(prev => [...prev, { type: 'error', text: 'Simulation encountered a script crash.' }]);
    } finally {
      setSimRunning(false);
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} color="var(--emerald)" />
          ) : (
            <AlertCircle size={18} color="var(--rose)" />
          )}
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      {!token ? (
        /* ================= AUTHENTICATION VIEW ================= */
        <div className="auth-page">
          <div className="glass-card auth-card">
            <div className="auth-header">
              <div className="auth-logo">ExpenseWallet</div>
              <p className="auth-subtitle">Simulate & Audit Departmental Wallets</p>
            </div>

            <div className="auth-tabs">
              <button
                className={`auth-tab ${activeAuthTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveAuthTab('login'); setError(null); }}
              >
                Login
              </button>
              <button
                className={`auth-tab ${activeAuthTab === 'register' ? 'active' : ''}`}
                onClick={() => { setActiveAuthTab('register'); setError(null); }}
              >
                Register
              </button>
            </div>

            {error && (
              <div style={{ background: 'var(--rose-bg)', color: 'var(--rose)', border: '1px solid var(--rose)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={activeAuthTab === 'login' ? handleLogin : handleRegister}>
              {activeAuthTab === 'register' && (
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="john_doe"
                    required
                    value={authData.username}
                    onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="admin@enterprise.com"
                  required
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  required
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                />
              </div>

              {activeAuthTab === 'register' && (
                <div className="form-group">
                  <label className="form-label">Department / Business Unit</label>
                  <select
                    className="form-select"
                    value={authData.departmentId}
                    onChange={(e) => setAuthData({ ...authData, departmentId: parseInt(e.target.value) })}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className="btn" disabled={loading}>
                {loading ? (
                  <RefreshCw className="spinner" size={18} />
                ) : (
                  activeAuthTab === 'login' ? 'Access Dashboard' : 'Create Account'
                )}
              </button>
            </form>

            <div className="quick-users-title">Developer Quick Sandbox Access</div>
            <div className="quick-users-grid">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept.id}
                  type="button"
                  className="quick-user-btn"
                  onClick={() => handleQuickRegisterAndLogin(dept.id, dept.name)}
                >
                  ⚡ Register & Login ({dept.name})
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              * Creates a random test user & connects instantly.
            </p>
          </div>
        </div>
      ) : (
        /* ================= DASHBOARD VIEW ================= */
        <>
          <header className="dashboard-header">
            <div>
              <div className="brand-title">ExpenseWallet</div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enterprise Ledger Control</p>
            </div>
            <div className="user-profile">
              <div className="user-info">
                <div className="user-name">Admin User</div>
                <div className="user-dept">{wallet ? `${wallet.department_name} Department` : 'Syncing...'}</div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={16} />
              </button>
            </div>
          </header>

          <main style={{ flex: 1 }}>
            <div className="dashboard-grid">

              {/* Left Column: Stats & Simulators */}
              <div className="left-column">

                {/* Balance stats */}
                <div className="glass-card wallet-card">
                  <div className="wallet-title">Department Budget Balance</div>
                  <div className="wallet-balance">
                    {loading && !wallet ? (
                      <span className="pulse">0.00 INR</span>
                    ) : (
                      `${wallet ? Number(wallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'} INR`
                    )}
                  </div>
                  <div className="wallet-meta">
                    <Wallet size={14} />
                    <span>Real-time wallet balance</span>
                  </div>
                </div>

                {/* Make a payment */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={18} color="var(--primary)" />
                    Pay Expense Invoice
                  </h3>
                  <form onSubmit={handleSinglePayment}>
                    <div className="form-group">
                      <label className="form-label">Vendor / Payee Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Acme Vendor Corp"
                        value={paymentData.vendorName}
                        onChange={(e) => setPaymentData({ ...paymentData, vendorName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount (INR)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="500"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="btn" disabled={loading}>
                      {loading ? <RefreshCw className="spinner" size={18} /> : 'Pay Expense'}
                    </button>
                  </form>
                </div>

                {/* Concurrency Simulator Panel */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Play size={18} color="var(--secondary)" />
                    Race Condition Simulator
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>
                    Trigger rapid simultaneous operations to test backend concurrency safety.
                  </p>

                  <div className="sim-grid">
                    <button
                      className={`sim-card ${simulationType === 'valid' ? 'active' : ''}`}
                      onClick={() => setSimulationType('valid')}
                      disabled={simRunning}
                    >
                      <div className="sim-title">
                        High-Volume Valid Case
                        <span className="sim-badge valid">Valid</span>
                      </div>
                      <p className="sim-desc">
                        Resets wallet to 50,000 INR. Submits 10 concurrent payments of 500 INR at the exact same millisecond. Expected: All 10 succeed, balance = 45,000 INR.
                      </p>
                    </button>

                    <button
                      className={`sim-card ${simulationType === 'edge' ? 'active' : ''}`}
                      onClick={() => setSimulationType('edge')}
                      disabled={simRunning}
                    >
                      <div className="sim-title">
                        Edge Case (Insufficient Funds)
                        <span className="sim-badge edge">Edge</span>
                      </div>
                      <p className="sim-desc">
                        Resets wallet to 2,000 INR. Submits 2 concurrent payments of 1,500 INR at the exact same millisecond. Expected: 1 succeeds, 1 fails, balance = 500 INR.
                      </p>
                    </button>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={autoReset}
                        onChange={(e) => setAutoReset(e.target.checked)}
                        disabled={simRunning}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      Auto-Reset Wallet balance before running test
                    </label>

                    <button
                      className="btn"
                      style={{ background: 'var(--accent-gradient)' }}
                      onClick={runSimulation}
                      disabled={simRunning}
                    >
                      {simRunning ? (
                        <>
                          <RefreshCw className="spinner" size={16} /> Running Sim...
                        </>
                      ) : (
                        'Fire Concurrency Test'
                      )}
                    </button>
                  </div>

                  {simLogs.length > 0 && (
                    <div className="sim-progress-container">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        <span>Progress</span>
                        <span>{simProgress}%</span>
                      </div>
                      <div className="sim-bar-bg">
                        <div className="sim-bar-fill" style={{ width: `${simProgress}%` }}></div>
                      </div>
                      <div className="sim-logs">
                        {simLogs.map((log, index) => (
                          <div
                            key={index}
                            className={`sim-log-item ${log.type === 'success' ? 'success' : log.type === 'error' ? 'error' : ''}`}
                          >
                            &gt; {log.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset Wallet Button */}
                <div className="glass-card" style={{ padding: '16px', borderStyle: 'dashed' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '14px' }}>Reset Ledger State</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Restore balance to 50k and wipe transactions</p>
                    </div>
                    <button
                      className="logout-btn"
                      style={{ borderColor: 'var(--amber)', color: 'var(--amber)', background: 'none' }}
                      onClick={() => handleResetWallet(50000)}
                    >
                      Reset State
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Transaction Ledger */}
              <div className="glass-card">
                <div className="ledger-header">
                  <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Department Ledger / Transactions</h3>
                  <button
                    className="logout-btn"
                    style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => user && fetchWalletAndTransactions(user.departmentId)}
                    disabled={loading}
                  >
                    <RefreshCw size={12} className={loading ? 'spinner' : ''} />
                    Sync
                  </button>
                </div>

                <div className="ledger-container">
                  {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                      <Building2 size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p>No transactions registered on this wallet ledger.</p>
                      <p style={{ fontSize: '12px', marginTop: '4px' }}>Submit a payment above to see logs.</p>
                    </div>
                  ) : (
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Vendor / Payee</th>
                          <th>Amount</th>
                          <th>Authorized By</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="ledger-row">
                            <td>#{tx.id}</td>
                            <td style={{ fontWeight: '500' }}>{tx.vendor_name}</td>
                            <td style={{ fontWeight: '600', color: tx.status === 'SUCCESS' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                              {Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
                            </td>
                            <td>{tx.paid_by || 'System'}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                              {new Date(tx.createdAt || tx.createdat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td>
                              <span className={`status-pill ${tx.status === 'SUCCESS' ? 'success' : 'failed'}`}>
                                {tx.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
