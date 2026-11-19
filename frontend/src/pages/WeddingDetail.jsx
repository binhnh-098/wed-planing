import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';

export default function WeddingDetail() {
  const { id } = useParams();
  const [wedding, setWedding] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');

  async function load() {
    const { data } = await client.get(`/weddings/${id}`);
    setWedding(data);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAddTask(e) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await client.post('/tasks', { weddingId: Number(id), title: taskTitle });
    setTaskTitle('');
    load();
  }

  async function toggleTask(task) {
    const nextStatus = task.status === 'DONE' ? 'PENDING' : 'DONE';
    await client.patch(`/tasks/${task.id}`, { status: nextStatus });
    load();
  }

  if (!wedding) return <p>Đang tải...</p>;

  const budgetTotal = wedding.budgetItems.reduce((sum, b) => sum + Number(b.estimatedCost), 0);

  return (
    <div style={{ maxWidth: 640, margin: '40px auto' }}>
      <h2>{wedding.title}</h2>
      <p>Trạng thái: {wedding.status}</p>

      <h3>Công việc</h3>
      <form onSubmit={handleAddTask}>
        <input placeholder="Công việc mới" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
        <button type="submit">Thêm</button>
      </form>
      <ul>
        {wedding.tasks.map((t) => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.status === 'DONE'} onChange={() => toggleTask(t)} />
              {t.title}
            </label>
          </li>
        ))}
      </ul>

      <h3>Ngân sách (tổng dự toán: {budgetTotal.toLocaleString()} đ)</h3>
      <ul>
        {wedding.budgetItems.map((b) => (
          <li key={b.id}>
            {b.category}: {Number(b.estimatedCost).toLocaleString()} đ
          </li>
        ))}
      </ul>

      <h3>Khách mời ({wedding.guests.length})</h3>
      <ul>
        {wedding.guests.map((g) => (
          <li key={g.id}>
            {g.name} — {g.rsvpStatus}
          </li>
        ))}
      </ul>
    </div>
  );
}
