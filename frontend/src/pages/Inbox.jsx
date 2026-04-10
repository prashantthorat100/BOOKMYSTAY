import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function Inbox() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesContainerRef = useRef(null);
  
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('user'));
  } catch {
    currentUser = null;
  }

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3s
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
      if (res.data.length > 0 && !activeChat) {
        setActiveChat(res.data[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load inbox');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/messages/property/${activeChat.property_id}/user/${activeChat.other_user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/messages', {
        property_id: activeChat.property_id,
        receiver_id: activeChat.other_user_id,
        text: newMessage
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessages([...messages, res.data]);
      setNewMessage('');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ padding: 'var(--spacing-xl) 0', height: 'calc(100vh - 80px)', display: 'flex' }}>
      <div style={{
        display: 'flex', width: '100%', background: 'white', borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--neutral-200)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
      }}>
        
        {/* Sidebar */}
        <div style={{ width: '350px', borderRight: '1px solid var(--neutral-200)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--neutral-200)', background: 'var(--neutral-50)' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Messages</h2>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-500)' }}>No messages yet.</p>
            ) : (
              conversations.map(conv => {
                const isActive = activeChat?.property_id === conv.property_id && activeChat?.other_user_id === conv.other_user_id;
                return (
                  <div 
                    key={`${conv.property_id}_${conv.other_user_id}`}
                    onClick={() => setActiveChat(conv)}
                    style={{
                      padding: '1rem', borderBottom: '1px solid var(--neutral-100)', cursor: 'pointer',
                      background: isActive ? 'var(--neutral-100)' : 'white',
                      transition: 'background 0.2s', position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--neutral-800)' }}>{conv.other_user_name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                        {new Date(conv.last_message_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500, marginBottom: '0.25rem' }}>
                      🏠 {conv.property_title}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: conv.unread ? 600 : 400 }}>
                      {conv.last_message}
                    </div>
                    {conv.unread && (
                      <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {activeChat ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--neutral-50)' }}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--neutral-200)', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{activeChat.other_user_name}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--neutral-500)' }}>Topic: {activeChat.property_title}</p>
              </div>
              <button 
                onClick={() => navigate(`/property/${activeChat.property_id}`)}
                className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}
              >
                View Property
              </button>
            </div>

            {/* Chat History */}
            <div
              ref={messagesContainerRef}
              style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {messages.map((msg, i) => {
                const isMe = String(msg.sender_id) === String(currentUser.id);
                const senderLabel = isMe ? 'You' : msg.sender_name || activeChat.other_user_name;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '0.75rem 1rem',
                      borderRadius: '1.25rem',
                      background: isMe ? 'var(--primary)' : 'white',
                      color: isMe ? 'white' : 'var(--neutral-800)',
                      border: isMe ? 'none' : '1px solid var(--neutral-200)',
                      borderBottomRightRadius: isMe ? '0.25rem' : '1.25rem',
                      borderBottomLeftRadius: isMe ? '1.25rem' : '0.25rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.85, marginBottom: '0.25rem' }}>
                        {senderLabel}
                      </div>
                      <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                      <div style={{ fontSize: '0.65rem', textAlign: 'right', marginTop: '0.25rem', opacity: 0.8 }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <div style={{ padding: '1rem', background: 'white', borderTop: '1px solid var(--neutral-200)' }}>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="form-input"
                  style={{ flex: 1, borderRadius: '500px', margin: 0 }}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '500px', padding: '0.75rem 1.5rem' }} disabled={!newMessage.trim()}>
                  Send
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--neutral-50)' }}>
            <div style={{ textAlign: 'center', color: 'var(--neutral-400)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
              <h3 style={{ margin: 0 }}>Select a conversation</h3>
              <p>Choose a chat from the sidebar to continue the conversation</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Inbox;
