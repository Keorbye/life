import { useState, useEffect } from 'react'
import { useResources } from '../lib/useResources'
import { Alert } from '../components/ui'

export default function ResourcesPage() {
  const { loading, error, setError, resources, addResource, updateProgress, refresh } = useResources()
  const [title, setTitle] = useState<string>('')
  const [type, setType] = useState<'book' | 'article' | 'research' | 'framework' | 'reference' | 'other'>('book')
  const [category, setCategory] = useState<'career' | 'hobbies' | 'health' | 'finance' | 'education' | 'other'>('career')
  const [summary, setSummary] = useState<string>('')
  const [author, setAuthor] = useState<string>('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [tags, setTags] = useState<string[]>([])
  const [sourceUrl, setSourceUrl] = useState<string>('')

  if (loading) return <p className="py-16 text-center text-[#8a7a65]">Loading resources data…</p>

  function handleAdd() {
    const res = addResource(title, type, category, summary, author, priority, tags, sourceUrl)
    if (res.error) setError(res.error)
    else {
      setTitle('')
      setType('book')
      setCategory('career')
      setSummary('')
      setAuthor('')
      setPriority('medium')
      setTags([])
      setSourceUrl('')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-3xl text-[#3e342c] mb-4">Knowledge & Insight Logs (Resources)</h1>
      
      <div className="rounded-2xl border border-[#e7dcc8] bg-white/60 p-6 mb-8">
        <form onSubmit={e => { e.preventDefault(); handleAdd() }} className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            >
              <option value="book">Book</option>
              <option value="article">Article</option>
              <option value="research">Research</option>
              <option value="framework">Framework</option>
              <option value="reference">Reference</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            >
              <option value="career">Career</option>
              <option value="hobbies">Hobbies</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Tags (comma-separated)</label>
            <input
              value={tags.join(', ')}
              onChange={e => setTags(e.target.value.split(',').map(t => t.trim()).filter(t => t))}
              placeholder="e.g., productiveness, reading, research"
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#5c4a3f] mb-1">Source URL (optional)</label>
            <input
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              className="w-full rounded-lg border border-[#e7dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3e342c]"
            />
          </div>
          <button type="submit" className="rounded-lg bg-[#c9a24b] col-span-2 px-6 py-2.5 text-sm font-medium text-[#3e342c] hover:bg-[#e6d3a3] transition">
            Add Resource
          </button>
        </form>
      </div>
</div>