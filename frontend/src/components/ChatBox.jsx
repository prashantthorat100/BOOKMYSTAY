import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

function ChatBox({ propertyId, hostId, hostName = 'Host', currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/messages/property/${propertyId}/user/${hostId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/messages', {
        property_id: propertyId,
        receiver_id: hostId,
        text: newMessage
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessages([...messages, res.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-outline" 
        style={{ width: '100%', marginTop: 'var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <span style={{ fontSize: '1.25rem' }}>💬</span> Message {hostName || 'Host'}
      </button>
    );
  }

  return (
    <div style={{ 
      marginTop: 'var(--spacing-md)', 
      border: '1px solid var(--neutral-200)', 
      borderRadius: 'var(--radius-lg)', 
      overflow: 'hidden',
      background: 'white',
      height: '400px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ padding: '1rem', background: 'var(--neutral-800)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Chat with {hostName || 'Host'}</h3>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Property inquiries go here</div>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--neutral-50)' }}
      >
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--neutral-400)', margin: 'auto' }}>Send a message to start the conversation.</p>
        ) : (
          messages.map((msg, i) => {
            const isMe = String(msg.sender_id) === String(currentUserId);
            const senderLabel = isMe ? 'You' : msg.sender_name || 'Guest';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '1rem',
                  background: isMe ? 'var(--primary)' : 'white',
                  color: isMe ? 'white' : 'var(--neutral-800)',
                  border: isMe ? 'none' : '1px solid var(--neutral-200)',
                  borderBottomRightRadius: isMe ? '0.25rem' : '1rem',
                  borderBottomLeftRadius: isMe ? '1rem' : '0.25rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.85, marginBottom: '0.25rem' }}>
                    {senderLabel}
                  </div>
                  <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '0.75rem', background: 'white', borderTop: '1px solid var(--neutral-200)' }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask a question..."
            className="form-input"
            style={{ flex: 1, borderRadius: '500px', margin: 0, padding: '0.5rem 1rem' }}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: '500px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }} disabled={!newMessage.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatBox;
