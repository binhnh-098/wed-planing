import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function WeddingList() {
  const [weddings, setWeddings] = useState([]);
  const [title, setTitle] = useState('');

  async function load() {
    const { data } = await client.get('/weddings');
    setWeddings(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await client.post('/weddings', { title });
    setTitle('');
    load();
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto' }}>
      <h2>Danh sách đám cưới</h2>
      <form onSubmit={handleCreate}>
        <input placeholder="Tên đám cưới (vd: Lan & Minh)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit">Tạo mới</button>
      </form>
      <ul>
        {weddings.map((w) => (
          <li key={w.id}>
            <Link to={`/weddings/${w.id}`}>{w.title}</Link> — {w.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
