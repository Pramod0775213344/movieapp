import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, Trash2, Film, Users, LayoutDashboard, LogOut, 
  PlusCircle, PlaySquare, Clock, Tag, Search, X, Plus, Loader2, Tv, Monitor, Bell, Settings, Shield, Mail, Calendar, ChevronRight, BarChart3, TrendingUp, Activity
} from 'lucide-react';
import './App.css';

// Synchronized with Live Railway Server
const API_BASE_URL = 'https://movieapp-production-8fce.up.railway.app/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [movies, setMovies] = useState([]);
  const [tvSeries, setTvSeries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));
  const [authData, setAuthData] = useState({ email: '', password: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);

  const [formData, setFormData] = useState({ title: '', description: '', genre: '', duration: '', tmdbPosterPath: '' });
  const [videoFile, setVideoFile] = useState(null);

  useEffect(() => { 
    if (isAuthenticated) { 
      fetchAllData();
    } 
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchMovies(), fetchTvSeries(), fetchUsers()]);
    setLoading(false);
  };

  const fetchMovies = async () => { try { const res = await axios.get(`${API_BASE_URL}/admin/movies`); setMovies(res.data); } catch(e){} };
  const fetchTvSeries = async () => { try { const res = await axios.get(`${API_BASE_URL}/admin/tv-series`); setTvSeries(res.data); } catch(e){} };
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setUsers(res.data);
    } catch(e){ console.error('Fetch Users Error:', e.response?.data || e.message); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, authData);
      localStorage.setItem('adminToken', res.data.token);
      
      // Auto-promote to admin if first time
      await axios.post(`${API_BASE_URL}/admin/make-me-admin`, {}, {
        headers: { Authorization: `Bearer ${res.data.token}` }
      }).catch(err => console.log('Already admin or setup failed'));

      setIsAuthenticated(true);
    } catch(e) { 
      alert('Authentication failed.'); 
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (val.length < 3) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/tmdb-search?query=${val}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
    finally { setIsSearching(false); }
  };

  const handleSelect = (item) => {
    setFormData({
      title: item.title || item.name,
      description: item.overview,
      genre: 'Action, Thriller', 
      duration: '120',
      tmdbPosterPath: `https://image.tmdb.org/t/p/w500${item.poster_path}`
    });
    setSelectedItem(item);
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadInfo, setUploadInfo] = useState('');

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);
    setUploadInfo('Preparing intelligent chunked upload...');

    try {
      const authHeaders = { Authorization: `Bearer ${localStorage.getItem('adminToken')}` };
      let videoUrl = '';
      let posterUrl = formData.tmdbPosterPath;

      // 1. Resumable Multipart Upload Logic
      if (videoFile) {
        const fileId = `${videoFile.name}_${videoFile.size}`;
        const cacheKey = `uploadState_${fileId}`;
        let uploadState = JSON.parse(localStorage.getItem(cacheKey));
        
        let uploadId, key;
        let uploadedParts = [];

        if (uploadState && uploadState.uploadId) {
          setUploadInfo('Resuming previous upload session...');
          uploadId = uploadState.uploadId;
          key = uploadState.key;
          uploadedParts = uploadState.parts || [];
        } else {
          setUploadInfo('Starting new multipart upload...');
          const startRes = await axios.post(`${API_BASE_URL}/admin/multipart/start`, {
            fileName: videoFile.name,
            fileType: videoFile.type,
            folder: 'videos'
          }, { headers: authHeaders });
          
          uploadId = startRes.data.uploadId;
          key = startRes.data.key;
          localStorage.setItem(cacheKey, JSON.stringify({ uploadId, key, parts: [] }));
        }

        const totalChunks = Math.ceil(videoFile.size / CHUNK_SIZE);
        
        for (let i = 0; i < totalChunks; i++) {
          const partNumber = i + 1;
          
          // Skip if already uploaded in a previous session
          if (uploadedParts.find(p => p.PartNumber === partNumber)) {
             setUploadProgress(Math.floor((partNumber / totalChunks) * 100));
             continue;
          }

          setUploadInfo(`Uploading chunk ${partNumber} of ${totalChunks}...`);
          
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, videoFile.size);
          const chunk = videoFile.slice(start, end);

          let retries = 3;
          let chunkUploaded = false;

          while (retries > 0 && !chunkUploaded) {
            try {
               const urlRes = await axios.post(`${API_BASE_URL}/admin/multipart/get-url`, {
                 uploadId, key, partNumber
               }, { headers: authHeaders });

               const uploadRes = await axios.put(urlRes.data.uploadUrl, chunk, {
                 headers: { 'Content-Type': videoFile.type }
               });

               const etag = uploadRes.headers.etag;
               uploadedParts.push({ PartNumber: partNumber, ETag: etag });
               
               // Save progress to localStorage
               localStorage.setItem(cacheKey, JSON.stringify({ uploadId, key, parts: uploadedParts }));
               
               setUploadProgress(Math.floor((partNumber / totalChunks) * 100));
               chunkUploaded = true;
            } catch (chunkErr) {
               retries--;
               
               // Extract exact error for debugging
               let exactError = chunkErr.message;
               if (chunkErr.response) {
                  // The request was made and the server responded with a status code
                  // that falls out of the range of 2xx
                  if (typeof chunkErr.response.data === 'string') {
                    exactError = `HTTP ${chunkErr.response.status}: ${chunkErr.response.data.substring(0, 50)}`;
                  } else if (chunkErr.response.data?.message) {
                    exactError = `HTTP ${chunkErr.response.status}: ${chunkErr.response.data.message}`;
                  } else {
                    exactError = `HTTP ${chunkErr.response.status}: ${chunkErr.response.statusText}`;
                  }
               } else if (chunkErr.request) {
                  // The request was made but no response was received
                  exactError = 'No response from Cloudflare/Server';
               }

               console.error(`Chunk ${partNumber} Error:`, chunkErr);

               if (retries === 0) throw new Error(`Failed at chunk ${partNumber}. Reason: ${exactError}`);
               
               setUploadInfo(`Error: ${exactError}. Retrying chunk ${partNumber} (${retries} attempts left)...`);
               await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retrying
            }
          }
        }

        setUploadInfo('Assembling chunks in Cloudflare R2...');
        const completeRes = await axios.post(`${API_BASE_URL}/admin/multipart/complete`, {
           uploadId, key, parts: uploadedParts
        }, { headers: authHeaders });
        
        videoUrl = completeRes.data.publicUrl;
        localStorage.removeItem(cacheKey); // Clean up tracking memory
      }

      // 2. Finalize: Save metadata to Database
      setUploadInfo('Finalizing system record...');
      const endpoint = activeTab === 'movies' ? '/admin/upload-metadata' : '/admin/tv-series/create';
      await axios.post(`${API_BASE_URL}${endpoint}`, {
        ...formData,
        videoUrl,
        posterUrl
      }, { headers: authHeaders });

      alert('Content Published to MovieApp Pro Successfully!');
      setSelectedItem(null);
      setVideoFile(null);
      setUploadProgress(0);
      fetchAllData();
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) { 
      console.error('Upload error:', err.response?.data || err.message);
      alert('Upload failed: ' + (err.response?.data?.message || err.message)); 
    }
    finally { setLoading(false); }
  };

  const deleteMovie = async (id) => {
    if(!window.confirm('Delete this?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/movie/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchMovies();
    } catch(e) { alert('Failed'); }
  };

  const handleLogout = () => { localStorage.removeItem('adminToken'); setIsAuthenticated(false); };

  if (!isAuthenticated) return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{display:'flex', justifyContent:'center', marginBottom:'20px'}}><PlaySquare size={48} color="var(--primary)" /></div>
        <h2>Admin Portal</h2>
        <p>Access the MovieApp Command Center</p>
        <form onSubmit={handleLogin}>
          <div className="input-group"><label>Email Address</label><input type="email" onChange={e => setAuthData({...authData, email: e.target.value})} required /></div>
          <div className="input-group"><label>Password</label><input type="password" onChange={e => setAuthData({...authData, password: e.target.value})} required /></div>
          <button className="btn-saas" style={{width: '100%', justifyContent: 'center', marginTop: '10px', height:'55px', color:'#fff'}} disabled={loginLoading}>
            {loginLoading ? <Loader2 className="animate-spin" /> : 'Authorize Access'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="admin-layout">
      <div className="sidebar">
        <div className="sidebar-logo"><Monitor color="var(--primary)" /> MOVIEAPP PRO</div>
        <div className="nav-group">
          <div className="nav-label">Main</div>
          <div className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={18} /> Overview</div>
          <div className={`nav-link ${activeTab === 'movies' ? 'active' : ''}`} onClick={() => setActiveTab('movies')}><Film size={18} /> Movies</div>
          <div className={`nav-link ${activeTab === 'tv' ? 'active' : ''}`} onClick={() => setActiveTab('tv')}><Tv size={18} /> TV Series</div>
          <div className="nav-label">System</div>
          <div className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={18} /> Users</div>
          <div className="nav-link"><Settings size={18} /> Settings</div>
        </div>
        <div className="sidebar-footer">
          <div className="nav-link" onClick={handleLogout} style={{color: '#ff4d4d'}}><LogOut size={18} /> Logout</div>
        </div>
      </div>

      <div className="main-wrapper">
        <div className="top-nav">
          <div className="nav-context"><Monitor size={16} color="var(--primary)" /><ChevronRight size={14} color="#444" /><span>{activeTab.toUpperCase()} CONTROL PANEL</span></div>
          <div className="user-profile"><button className="notif-btn"><Bell size={20} /><div className="notif-dot"></div></button><div className="avatar" style={{background:'var(--primary)', color:'#fff'}}>A</div></div>
        </div>

        <div className="content-area">
          {activeTab === 'dashboard' && (
            <>
              <div className="dashboard-header"><h1>Platform Analytics</h1><p>Real-time insights across Cloudflare R2 and Supabase.</p></div>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-info"><h4>Total Movies</h4><div className="value">{movies.length}</div><p style={{fontSize:'10px', color:'#e50914', marginTop:'5px'}}><TrendingUp size={12}/> High-fidelity library</p></div>
                  <div className="stat-icon-bg" style={{background:'rgba(229, 9, 20, 0.1)'}}><Film color="var(--primary)" /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info"><h4>TV Collections</h4><div className="value">{tvSeries.length}</div><p style={{fontSize:'10px', color:'#e50914', marginTop:'5px'}}><Tv size={12}/> Multi-season sync</p></div>
                  <div className="stat-icon-bg" style={{background:'rgba(229, 9, 20, 0.1)'}}><Tv color="var(--primary)" /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info"><h4>Active Users</h4><div className="value">{users.length}</div><p style={{fontSize:'10px', color:'#e50914', marginTop:'5px'}}><Users size={12}/> Verified subscribers</p></div>
                  <div className="stat-icon-bg" style={{background:'rgba(229, 9, 20, 0.1)'}}><Activity color="var(--primary)" /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info"><h4>Network Status</h4><div className="value">Optimal</div><p style={{fontSize:'10px', color:'#00ff88', marginTop:'5px'}}>Latency: 18ms</p></div>
                  <div className="stat-icon-bg" style={{background:'rgba(229, 9, 20, 0.1)'}}><BarChart3 color="var(--primary)" /></div>
                </div>
              </div>

              <div className="dashboard-sections" style={{display:'grid', gridTemplateColumns: '2fr 1.2fr', gap:'30px', marginTop:'40px'}}>
                <div className="recent-uploads-card" style={{background:'var(--bg-card)', padding:'30px', borderRadius:'24px', border:'1px solid var(--border)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><h3>Live Content Stream</h3><button className="btn-saas" style={{padding:'8px 16px', fontSize:'11px', color:'#fff'}}>Refresh Feed</button></div>
                  <div className="user-table-container" style={{margin:0, border:'none'}}>
                    <table className="user-table">
                      <thead><tr><th>Title</th><th>Origin</th><th>Timestamp</th><th>Status</th></tr></thead>
                      <tbody>
                        {[...movies, ...tvSeries].slice(0, 5).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map((item, idx) => (
                          <tr key={idx}>
                            <td><div style={{display:'flex', alignItems:'center', gap:'10px'}}><img src={item.poster_url} style={{width:'32px', height:'45px', borderRadius:'6px', objectFit:'cover'}} alt=""/>{item.title}</div></td>
                            <td>{item.duration ? <span className="badge badge-user">R2 Movie</span> : <span className="badge badge-admin">R2 Series</span>}</td>
                            <td>{new Date(item.created_at).toLocaleDateString()}</td>
                            <td><div style={{display:'flex', alignItems:'center', gap:'5px', color:'var(--primary)', fontSize:'12px'}}><div style={{width:'6px', height:'6px', background:'var(--primary)', borderRadius:'50%'}}></div> Active</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="platform-stats-card" style={{background:'var(--bg-card)', padding:'30px', borderRadius:'24px', border:'1px solid var(--border)'}}>
                  <h3>Storage Analytics</h3>
                  <div style={{marginTop:'30px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><span style={{fontSize:'13px'}}>Cloudflare R2 Usage</span><span style={{fontWeight:'700'}}>48%</span></div>
                    <div style={{width:'100%', height:'8px', background:'#222', borderRadius:'10px', overflow:'hidden'}}><div style={{width:'48%', height:'100%', background:'var(--primary)'}}></div></div>
                  </div>
                  <div style={{marginTop:'25px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><span style={{fontSize:'13px'}}>Database Integrity</span><span style={{fontWeight:'700'}}>100%</span></div>
                    <div style={{width:'100%', height:'8px', background:'#222', borderRadius:'10px', overflow:'hidden'}}><div style={{width:'100%', height:'100%', background:'#00ff88'}}></div></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'movies' && (
            <>
              <div className="dashboard-header"><h1>Movie Management</h1><p>Search TMDB and publish to R2.</p></div>
              <div className="search-box" style={{width: '100%', marginBottom: '40px', background: '#111'}}>
                <Search size={18} color="var(--primary)" />
                <input type="text" placeholder="Search Movie on TMDB..." value={searchQuery} onChange={e => handleSearch(e.target.value)} />
              </div>
              <div className="item-grid">
                {searchResults.map(item => (
                  <div key={item.id} className="item-card" onClick={() => handleSelect(item)}>
                    <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} className="item-image" alt="" />
                    <div className="item-overlay"><div className="item-title">{item.title}</div><Plus size={20} color="#fff" /></div>
                  </div>
                ))}
              </div>
              <div className="dashboard-header" style={{marginTop:'40px'}}><h3>Published Library</h3></div>
              <div className="item-grid">
                {movies.map(movie => (
                  <div key={movie.id} className="item-card">
                    <img src={movie.poster_url} className="item-image" alt="" />
                    <div className="item-overlay"><div className="item-title">{movie.title}</div><Trash2 size={16} color="#ff4d4d" onClick={() => deleteMovie(movie.id)} /></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedItem && (
        <div className="saas-modal">
          <div className="saas-modal-content">
            <div className="close-modal" onClick={() => setSelectedItem(null)}><X size={32} /></div>
            <h2>Publishing to Cloudflare R2</h2>
            <form onSubmit={handleUpload}>
              <div className="form-grid">
                <div className="input-group"><label>Title</label><input type="text" value={formData.title} readOnly /></div>
                <div className="input-group"><label>Genres</label><input type="text" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} /></div>
              </div>
              <div className="input-group"><label>Overview</label><textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea></div>
              <div style={{display: 'flex', gap: '30px', alignItems: 'center'}}>
                <div className="file-input-container" style={{flex: 1}}>
                  <Upload size={32} color="var(--primary)" />
                  <p>{videoFile ? videoFile.name : 'Select Video File'}</p>
                  <input type="file" id="up" style={{display: 'none'}} onChange={e => setVideoFile(e.target.files[0])} />
                  <label htmlFor="up" className="btn-saas" style={{margin: '15px auto', fontSize: '12px', color:'#fff'}}>Browse Files</label>
                </div>
                <img src={formData.tmdbPosterPath} style={{width: '120px', borderRadius: '16px', border: '1px solid var(--border)'}} alt="" />
              </div>

              {loading && (
                <div style={{marginTop: '20px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px'}}>
                    <span style={{color: 'var(--primary)', fontWeight: '700'}}>{uploadProgress}% Uploaded</span>
                    <span style={{color: '#666'}}>{uploadInfo}</span>
                  </div>
                  <div style={{width: '100%', height: '8px', background: '#222', borderRadius: '10px', overflow: 'hidden'}}>
                    <div style={{width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease'}}></div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-saas" style={{width: '100%', marginTop: '30px', justifyContent: 'center', color:'#fff'}} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Start Cloud Upload'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
