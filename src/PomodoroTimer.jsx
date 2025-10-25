import React, { useState, useEffect, useRef } from 'react';

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('trabajo'); // trabajo, descanso, descanso-largo
  const [sessionCount, setSessionCount] = useState(1);
  const [showOptions, setShowOptions] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [currentLandscape, setCurrentLandscape] = useState(0);
  const [notificationSound, setNotificationSound] = useState('bell'); // bell, chime, alarm
  const [showFlash, setShowFlash] = useState(false);
  const audioRef = useRef(null);
  const musicAudioRef = useRef(null);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Tiempo completado
            playNotification();
            handleModeChange();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const playNotification = () => {
    // Play audio notification
    if (audioRef.current) {
      audioRef.current.volume = 0.7;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Visual flash notification
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 2000);
    
    // Browser notification if allowed
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ ¡Tiempo completado!", {
        body: mode === 'trabajo' ? '¡Sesión de trabajo terminada! Toma un descanso 🍅' : '¡Descanso terminado! A trabajar 💪',
        icon: '🍅'
      });
    }
  };

  const handleModeChange = () => {
    setIsActive(false);
    
    if (mode === 'trabajo') {
      // Guardar sesión completada en el historial
      const now = new Date();
      setSessionHistory(prev => [...prev, {
        id: Date.now(),
        type: 'trabajo',
        completedAt: now,
        duration: 25
      }]);
      
      if (sessionCount % 4 === 0) {
        // Descanso largo cada 4 sesiones
        setMode('descanso-largo');
        setMinutes(15);
      } else {
        setMode('descanso');
        setMinutes(5);
      }
      setSeconds(0);
    } else {
      setMode('trabajo');
      setMinutes(25);
      setSeconds(0);
      setSessionCount(sessionCount + 1);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'trabajo') {
      setMinutes(25);
    } else if (mode === 'descanso') {
      setMinutes(5);
    } else {
      setMinutes(15);
    }
    setSeconds(0);
  };

  const skipSession = () => {
    handleModeChange();
  };

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getModeText = () => {
    if (mode === 'trabajo') return `SESIÓN ${sessionCount} - TRABAJO`;
    if (mode === 'descanso') return 'DESCANSO CORTO';
    return 'DESCANSO LARGO';
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length > 0) {
      const newPlaylist = audioFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file)
      }));
      
      setPlaylist(newPlaylist);
      setCurrentTrackIndex(0);
      setCurrentTrack(newPlaylist[0]);
      
      if (musicAudioRef.current) {
        musicAudioRef.current.src = newPlaylist[0].url;
      }
    }
  };

  const toggleMusic = () => {
    if (!musicAudioRef.current || !currentTrack) return;
    
    if (musicPlaying) {
      musicAudioRef.current.pause();
    } else {
      musicAudioRef.current.play();
    }
    setMusicPlaying(!musicPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setMusicVolume(newVolume);
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = newVolume;
    }
  };

  const getTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessionHistory.filter(session => {
      const sessionDate = new Date(session.completedAt);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    
    const totalMinutes = todaySessions.reduce((acc, session) => acc + session.duration, 0);
    return { sessions: todaySessions.length, minutes: totalMinutes };
  };

  const playNextTrack = () => {
    if (playlist.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
    
    if (musicAudioRef.current) {
      musicAudioRef.current.src = playlist[nextIndex].url;
      if (musicPlaying) {
        musicAudioRef.current.play();
      }
    }
  };

  const playPreviousTrack = () => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
    
    if (musicAudioRef.current) {
      musicAudioRef.current.src = playlist[prevIndex].url;
      if (musicPlaying) {
        musicAudioRef.current.play();
      }
    }
  };

  const handleTrackEnd = () => {
    if (playlist.length > 1) {
      playNextTrack();
    } else if (musicAudioRef.current) {
      musicAudioRef.current.currentTime = 0;
      musicAudioRef.current.play();
    }
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const changeLandscape = () => {
    setCurrentLandscape((currentLandscape + 1) % 4);
  };

  // Effect for music track ending
  useEffect(() => {
    const audio = musicAudioRef.current;
    if (audio) {
      audio.addEventListener('ended', handleTrackEnd);
      return () => audio.removeEventListener('ended', handleTrackEnd);
    }
  }, [playlist, currentTrackIndex, musicPlaying]);

  // Request notification permissions
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <>
      {/* Google Fonts - More handwritten style */}
      <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=Gloria+Hallelujah&display=swap" rel="stylesheet" />
      
      {/* Custom animations */}
      <style>{`
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-400 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Flash notification overlay */}
        {showFlash && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div className="absolute inset-0 bg-orange-400 opacity-0 animate-pulse" style={{ animation: 'flash 0.5s ease-in-out 3' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-8 border-orange-600 animate-bounce">
                <p className="text-6xl font-black text-orange-600" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                  ⏰ ¡TIEMPO!
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Decorative clouds */}
        <div className="absolute top-10 left-10 w-32 h-16 bg-white rounded-full opacity-70 blur-sm"></div>
        <div className="absolute top-20 right-20 w-40 h-20 bg-white rounded-full opacity-60 blur-sm"></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-18 bg-white rounded-full opacity-50 blur-sm"></div>
        
        {/* Hidden audio elements */}
        {/* Bell sound - pleasant notification */}
        <audio ref={audioRef}>
          <source src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQtvT1+AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgH9/f39/f39+fn5+fn5+fX19fX19fHx8fHx8e3t7e3t7enp6enp6eXl5eXl5eHh4eHh4d3d3d3d3dnZ2dnZ2dXV1dXV1dHR0dHR0c3Nzc3Nzcmpqampqampra2tra2tsbGxsbGxtbW1tbW1ubm5ubm5vb29vb29wcHBwcHBxcXFxcXFycnJycnJzc3Nzc3N0dHR0dHR1dXV1dXV2dnZ2dnZ3d3d3d3d4eHh4eHh5eXl5eXl6enp6enp7e3t7e3t8fHx8fHx9fX19fX1+fn5+fn5/f39/f3+AgICAgICAgYGBgYGBgoKCgoKCg4ODg4ODhISEhISEhYWFhYWFhoaGhoaGh4eHh4eHiIiIiIiIiYmJiYmJioqKioqKi4uLi4uLjIyMjIyMjY2NjY2Njo6Ojo6Oj4+Pj4+PkJCQkJCQkZGRkZGRkpKSkpKSk5OTk5OTlJSUlJSUlZWVlZWVlpaWlpaWl5eXl5eXmJiYmJiYmZmZmZmZmpqampqam5ubm5ubnJycnJycnZ2dnZ2dnp6enp6en5+fn5+foKCgoKCgoaGhoaGhoqKioqKio6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OjoqKioqKioaGhoaGhoKCgoKCgn5+fn5+fnp6enp6enZ2dnZ2dnJycnJycm5ubm5ubmpqampqamZmZmZmZmJiYmJiYl5eXl5eXlpaWlpaWlZWVlZWVlJSUlJSUk5OTk5OTkpKSkpKSkZGRkZGRkJCQkJCQj4+Pj4+Pjo6Ojo6OjY2NjY2NjIyMjIyMi4uLi4uLioqKioqKiYmJiYmJiIiIiIiIh4eHh4eHhoaGhoaGhYWFhYWFhISEhISEg4ODg4ODgoKCgoKCgYGBgYGBgICAgICAgH9/f39/f35+fn5+fn19fX19fHx8fHx8e3t7e3t7" type="audio/wav" />
        </audio>
        <audio ref={musicAudioRef} volume={musicVolume} />

        <div className="bg-gradient-to-br from-orange-400 via-orange-300 to-orange-200 rounded-3xl shadow-2xl p-8 max-w-2xl w-full border-8 border-orange-800 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black text-orange-900 tracking-wider" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(-1deg)' }}>
              POMODORO TIMER
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setShowMenu(!showMenu);
                  setShowOptions(false);
                }}
                className={`w-8 h-8 ${showMenu ? 'bg-orange-700' : 'bg-orange-800'} rounded border-2 border-orange-900 flex items-center justify-center text-orange-200 hover:bg-orange-700 transition-colors text-xl`} 
                style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
              >
                ☰
              </button>
              <button 
                onClick={() => {
                  setShowOptions(!showOptions);
                  setShowMenu(false);
                }}
                className={`w-8 h-8 ${showOptions ? 'bg-orange-700' : 'bg-orange-800'} rounded border-2 border-orange-900 flex items-center justify-center text-orange-200 hover:bg-orange-700 transition-colors text-xl`}
                style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
              >
                ⚙
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div className="bg-orange-100 rounded-2xl p-8 mb-6 border-4 border-orange-800 text-center">
            <div className="text-8xl font-black text-orange-900 mb-4 tracking-wider" style={{ fontFamily: "'Kalam', cursive", transform: 'rotate(-2deg)' }}>
              {formatTime(minutes, seconds)}
            </div>
            <div className="text-2xl font-bold text-orange-800 tracking-wide" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(1deg)' }}>
              {getModeText()}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 mb-6 justify-center">
            <button
              onClick={toggleTimer}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-lg border-4 border-orange-900 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
              style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '22px', transform: 'rotate(-1deg)' }}
            >
              {isActive ? '❚❚' : '▶'}
            </button>
            
            <button
              onClick={resetTimer}
              className="bg-yellow-500 hover:bg-yellow-400 text-orange-900 font-bold py-3 px-8 rounded-lg border-4 border-orange-900 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
              style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '22px', transform: 'rotate(1deg)' }}
            >
              ↻
            </button>
            
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="bg-purple-400 hover:bg-purple-300 text-purple-900 font-bold py-3 px-6 rounded-lg border-4 border-orange-900 transition-all transform hover:scale-105 active:scale-95"
              style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '18px' }}
            >
              OPCIONES
            </button>
          </div>

          {/* Options Panel */}
          {showOptions && (
            <div className="bg-orange-100 rounded-2xl p-6 mb-6 border-4 border-orange-800">
              <h3 className="font-bold text-orange-900 mb-4 text-2xl" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(-1deg)' }}>
                ⚙️ CONFIGURACIÓN
              </h3>
              <div className="space-y-3">
                <button
                  onClick={skipSession}
                  className="w-full bg-orange-300 hover:bg-orange-200 text-orange-900 font-bold py-2 px-4 rounded border-2 border-orange-800 transition-colors"
                  style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '18px' }}
                >
                  ⏭ SALTAR SESIÓN
                </button>
                <button
                  onClick={() => {
                    setSessionCount(1);
                    setMode('trabajo');
                    setMinutes(25);
                    setSeconds(0);
                    setIsActive(false);
                  }}
                  className="w-full bg-orange-300 hover:bg-orange-200 text-orange-900 font-bold py-2 px-4 rounded border-2 border-orange-800 transition-colors"
                  style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '18px' }}
                >
                  🔄 REINICIAR TODO
                </button>
                <button
                  onClick={playNotification}
                  className="w-full bg-orange-300 hover:bg-orange-200 text-orange-900 font-bold py-2 px-4 rounded border-2 border-orange-800 transition-colors"
                  style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '18px' }}
                >
                  🔔 PROBAR SONIDO
                </button>
              </div>
              
              {/* Developer Credit */}
              <div className="mt-6 pt-4 border-t-2 border-orange-300">
                <p className="text-center text-orange-800 text-sm" style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '16px' }}>
                  ✨ Desarrollado con 💛 por
                </p>
                <p className="text-center text-orange-900 font-bold text-lg mt-1" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(-1deg)' }}>
                  Alex Quilis Vila
                </p>
              </div>
            </div>
          )}

          {/* Tasks Panel */}
          {showMenu && (
            <div className="bg-blue-100 rounded-2xl p-6 mb-6 border-4 border-orange-800">
              <h3 className="font-bold text-blue-900 mb-4 text-2xl" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(-1deg)' }}>
                📝 MIS TAREAS
              </h3>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Nueva tarea..."
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '16px' }}
                />
                <button
                  onClick={addTask}
                  className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-2 rounded-lg border-2 border-blue-800 transition-colors"
                  style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '18px' }}
                >
                  +
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-center text-blue-700 py-4" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                    No hay tareas. ¡Añade una! 📋
                  </p>
                ) : (
                  tasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg p-3 border-2 border-blue-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <span
                          className={`${task.completed ? 'line-through text-blue-400' : 'text-blue-900'}`}
                          style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '16px' }}
                        >
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-600 hover:text-red-800 font-bold text-xl"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Decorative Image Area and Side Buttons */}
          <div className="flex gap-4">
            <div className="flex-1 bg-gradient-to-b from-orange-300 via-yellow-300 to-green-600 rounded-xl border-4 border-orange-800 h-48 relative overflow-hidden cursor-pointer" onClick={changeLandscape}>
              {/* Landscape 0: Sunset (Atardecer) */}
              {currentLandscape === 0 && (
                <>
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-orange-200 via-pink-300 to-yellow-400"></div>
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-yellow-300 rounded-full border-4 border-orange-400 shadow-lg"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-green-700"></div>
                  <div className="absolute bottom-12 left-0 right-0 h-16">
                    <div className="absolute bottom-0 left-1/4 w-32 h-16 bg-green-600 rounded-t-full"></div>
                    <div className="absolute bottom-0 right-1/4 w-40 h-20 bg-green-700 rounded-t-full"></div>
                  </div>
                  <div className="absolute bottom-6 left-8 w-8 h-8 bg-pink-400 rounded-full border-2 border-pink-600"></div>
                  <div className="absolute bottom-8 left-16 w-6 h-6 bg-pink-300 rounded-full border-2 border-pink-500"></div>
                  <div className="absolute bottom-4 right-12 w-10 h-10 bg-yellow-400 rounded-full border-2 border-yellow-600"></div>
                  <div className="absolute bottom-6 right-24 w-7 h-7 bg-pink-400 rounded-full border-2 border-pink-600"></div>
                </>
              )}

              {/* Landscape 1: Starry Night (Noche estrellada) */}
              {currentLandscape === 1 && (
                <>
                  <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800"></div>
                  {/* Moon */}
                  <div className="absolute top-6 right-12 w-14 h-14 bg-yellow-100 rounded-full border-4 border-yellow-200 shadow-lg"></div>
                  {/* Stars */}
                  <div className="absolute top-8 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute top-16 left-24 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute top-12 right-20 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute top-20 right-32 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute top-24 left-16 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute top-28 right-16 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  {/* Dark hills */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-indigo-950"></div>
                  <div className="absolute bottom-12 left-0 right-0 h-16">
                    <div className="absolute bottom-0 left-1/4 w-32 h-16 bg-purple-950 rounded-t-full"></div>
                    <div className="absolute bottom-0 right-1/4 w-40 h-20 bg-indigo-950 rounded-t-full"></div>
                  </div>
                </>
              )}

              {/* Landscape 2: Sunrise (Amanecer) */}
              {currentLandscape === 2 && (
                <>
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-pink-200 via-orange-200 to-yellow-200"></div>
                  {/* Rising sun */}
                  <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-20 h-10 bg-orange-400 rounded-t-full border-4 border-orange-500 overflow-hidden"></div>
                  {/* Morning clouds */}
                  <div className="absolute top-6 left-8 w-16 h-6 bg-pink-200 rounded-full opacity-70"></div>
                  <div className="absolute top-12 right-12 w-20 h-8 bg-orange-200 rounded-full opacity-60"></div>
                  {/* Green ground */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-green-600"></div>
                  <div className="absolute bottom-16 left-0 right-0 h-16">
                    <div className="absolute bottom-0 left-1/3 w-28 h-14 bg-green-500 rounded-t-full"></div>
                    <div className="absolute bottom-0 right-1/3 w-36 h-18 bg-green-700 rounded-t-full"></div>
                  </div>
                  {/* Morning dew flowers */}
                  <div className="absolute bottom-8 left-12 w-6 h-6 bg-white rounded-full border-2 border-blue-200"></div>
                  <div className="absolute bottom-6 right-16 w-7 h-7 bg-white rounded-full border-2 border-blue-200"></div>
                </>
              )}

              {/* Landscape 3: Sunny Day (Día soleado) */}
              {currentLandscape === 3 && (
                <>
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-blue-300 via-blue-200 to-cyan-200"></div>
                  {/* Bright sun */}
                  <div className="absolute top-4 right-8 w-16 h-16 bg-yellow-400 rounded-full border-4 border-yellow-500 shadow-2xl"></div>
                  {/* Sun rays */}
                  <div className="absolute top-3 right-24 w-12 h-1 bg-yellow-300 transform rotate-45"></div>
                  <div className="absolute top-12 right-24 w-12 h-1 bg-yellow-300 transform -rotate-45"></div>
                  {/* White clouds */}
                  <div className="absolute top-8 left-12 w-20 h-8 bg-white rounded-full opacity-80"></div>
                  <div className="absolute top-16 left-32 w-16 h-6 bg-white rounded-full opacity-70"></div>
                  {/* Bright green ground */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-green-500"></div>
                  <div className="absolute bottom-12 left-0 right-0 h-16">
                    <div className="absolute bottom-0 left-1/4 w-32 h-16 bg-green-400 rounded-t-full"></div>
                    <div className="absolute bottom-0 right-1/4 w-40 h-20 bg-green-600 rounded-t-full"></div>
                  </div>
                  {/* Colorful flowers */}
                  <div className="absolute bottom-6 left-8 w-8 h-8 bg-red-400 rounded-full border-2 border-red-600"></div>
                  <div className="absolute bottom-8 left-20 w-6 h-6 bg-blue-400 rounded-full border-2 border-blue-600"></div>
                  <div className="absolute bottom-4 right-12 w-10 h-10 bg-purple-400 rounded-full border-2 border-purple-600"></div>
                  <div className="absolute bottom-6 right-28 w-7 h-7 bg-yellow-400 rounded-full border-2 border-yellow-600"></div>
                </>
              )}
              
              {/* Grass details (common to all) */}
              <div className="absolute bottom-2 left-1/4 w-1 h-4 bg-green-900"></div>
              <div className="absolute bottom-2 left-1/3 w-1 h-5 bg-green-900"></div>
              <div className="absolute bottom-2 right-1/3 w-1 h-4 bg-green-900"></div>
              <div className="absolute bottom-2 right-1/4 w-1 h-6 bg-green-900"></div>

              {/* Click indicator */}
              <div className="absolute bottom-2 right-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                Click para cambiar 🌄
              </div>
            </div>

            {/* Side Buttons with functionality */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  setShowMusic(!showMusic);
                  setShowHistory(false);
                  setShowStats(false);
                }}
                className={`w-16 h-14 ${showMusic ? 'bg-green-500' : 'bg-green-400'} hover:bg-green-300 rounded-lg border-4 border-orange-900 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 relative`}
              >
                <span className="text-4xl" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(-5deg)' }}>♪</span>
                {musicPlaying && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </button>
              <button 
                onClick={() => {
                  setShowHistory(!showHistory);
                  setShowMusic(false);
                  setShowStats(false);
                }}
                className={`w-16 h-14 ${showHistory ? 'bg-yellow-400' : 'bg-yellow-300'} hover:bg-yellow-200 rounded-lg border-4 border-orange-900 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95`}
              >
                <span className="text-3xl" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(3deg)' }}>≡</span>
              </button>
              <button 
                onClick={() => {
                  setShowStats(!showStats);
                  setShowMusic(false);
                  setShowHistory(false);
                }}
                className={`w-16 h-14 ${showStats ? 'bg-purple-400' : 'bg-purple-300'} hover:bg-purple-200 rounded-lg border-4 border-orange-900 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95`}
              >
                <span className="text-3xl" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>📊</span>
              </button>
            </div>
          </div>

          {/* Music Panel */}
          {showMusic && (
            <div className="mt-6 bg-green-100 rounded-2xl p-6 border-4 border-orange-800">
              <h3 className="font-bold text-green-900 mb-4 text-2xl" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(-1deg)' }}>
                🎵 MÚSICA
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border-2 border-green-700">
                  <label 
                    htmlFor="music-file" 
                    className="block text-center cursor-pointer text-green-900 font-bold hover:text-green-700"
                    style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '18px' }}
                  >
                    📁 Seleccionar archivos de música
                  </label>
                  <input
                    id="music-file"
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {playlist.length > 0 && (
                    <p className="text-center text-sm text-green-700 mt-2" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                      {playlist.length} {playlist.length === 1 ? 'canción' : 'canciones'} en la playlist
                    </p>
                  )}
                </div>

                {currentTrack && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border-2 border-green-700">
                      <p className="text-base text-green-900 truncate" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                        🎼 {currentTrack.name}
                      </p>
                      {playlist.length > 1 && (
                        <p className="text-xs text-green-600 mt-1" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                          {currentTrackIndex + 1} de {playlist.length}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {playlist.length > 1 && (
                        <button
                          onClick={playPreviousTrack}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg border-2 border-green-800 transition-colors"
                          style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '16px' }}
                        >
                          ⏮ Anterior
                        </button>
                      )}
                      
                      <button
                        onClick={toggleMusic}
                        className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded-lg border-2 border-green-800 transition-colors"
                        style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '18px' }}
                      >
                        {musicPlaying ? '⏸ PAUSAR' : '▶ REPRODUCIR'}
                      </button>

                      {playlist.length > 1 && (
                        <button
                          onClick={playNextTrack}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg border-2 border-green-800 transition-colors"
                          style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '16px' }}
                        >
                          Siguiente ⏭
                        </button>
                      )}
                    </div>

                    <div className="bg-white rounded-lg p-3 border-2 border-green-700">
                      <label className="block text-base text-green-900 mb-2" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                        🔊 Volumen
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={musicVolume}
                        onChange={handleVolumeChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 rounded-lg p-3 border-2 border-yellow-600">
                  <p className="text-sm text-yellow-900" style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '15px' }}>
                    💡 Tip: Puedes seleccionar múltiples archivos MP3 para crear una playlist y escuchar mientras trabajas
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* History Panel */}
          {showHistory && (
            <div className="mt-6 bg-yellow-100 rounded-2xl p-6 border-4 border-orange-800">
              <h3 className="font-bold text-yellow-900 mb-4 text-2xl" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(-1deg)' }}>
                📋 SESIONES DE HOY
              </h3>
              
              {sessionHistory.length === 0 ? (
                <div className="text-center text-yellow-800 py-8" style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '18px' }}>
                  Aún no has completado ninguna sesión hoy.
                  <br />
                  ¡A trabajar! 💪
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sessionHistory.map((session, index) => (
                    <div 
                      key={session.id}
                      className="bg-white rounded-lg p-3 border-2 border-yellow-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🍅</span>
                        <div>
                          <p className="font-bold text-yellow-900 text-lg" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                            Sesión {index + 1}
                          </p>
                          <p className="text-sm text-yellow-700" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                            {new Date(session.completedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-base text-yellow-800 font-bold" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                        {session.duration} min
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Panel */}
          {showStats && (
            <div className="mt-6 bg-purple-100 rounded-2xl p-6 border-4 border-orange-800">
              <h3 className="font-bold text-purple-900 mb-4 text-2xl" style={{ fontFamily: "'Gloria Hallelujah', cursive", transform: 'rotate(-1deg)' }}>
                📊 ESTADÍSTICAS
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border-2 border-purple-700 text-center">
                  <p className="text-5xl font-bold text-purple-900 mb-1" style={{ fontFamily: "'Kalam', cursive", transform: 'rotate(-2deg)' }}>
                    {getTodayStats().sessions}
                  </p>
                  <p className="text-base text-purple-700" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                    Sesiones hoy
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border-2 border-purple-700 text-center">
                  <p className="text-5xl font-bold text-purple-900 mb-1" style={{ fontFamily: "'Kalam', cursive", transform: 'rotate(2deg)' }}>
                    {getTodayStats().minutes}
                  </p>
                  <p className="text-base text-purple-700" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                    Minutos hoy
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border-2 border-purple-700 text-center">
                  <p className="text-5xl font-bold text-purple-900 mb-1" style={{ fontFamily: "'Kalam', cursive", transform: 'rotate(-1deg)' }}>
                    {sessionHistory.length}
                  </p>
                  <p className="text-base text-purple-700" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                    Total sesiones
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border-2 border-purple-700 text-center">
                  <p className="text-5xl font-bold text-purple-900 mb-1" style={{ fontFamily: "'Kalam', cursive", transform: 'rotate(1deg)' }}>
                    {Math.floor(sessionHistory.length / 4)}
                  </p>
                  <p className="text-base text-purple-700" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                    Ciclos completos
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-pink-50 rounded-lg p-4 border-2 border-pink-600">
                <p className="text-center text-pink-900 font-bold text-lg" style={{ fontFamily: "'Gloria Hallelujah', cursive" }}>
                  🔥 ¡Sigue así! Cada pomodoro cuenta
                </p>
              </div>
            </div>
          )}

          {/* Stats Bottom */}
          <div className="mt-6 text-center text-orange-900 font-bold" style={{ fontFamily: "'Gloria Hallelujah', cursive", fontSize: '16px' }}>
            <p>
              🍅 Sesiones completadas hoy: {sessionHistory.filter(s => {
                const today = new Date();
                const sessionDate = new Date(s.completedAt);
                return today.toDateString() === sessionDate.toDateString();
              }).length}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}