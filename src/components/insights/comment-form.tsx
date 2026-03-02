'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface CommentFormProps {
  insightId: number
  onCommentAdded: () => void
}

export function CommentForm({ insightId, onCommentAdded }: CommentFormProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = text.trim()
    if (!trimmed) return

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/insights/${insightId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: 'Team', text: trimmed }),
      })

      if (!res.ok) {
        throw new Error('Failed to add comment')
      }

      setText('')
      onCommentAdded()
    } catch (err) {
      console.error('Error adding comment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a team note..."
        className="min-h-[80px] resize-none border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-ring"
      />
      <Button
        type="submit"
        disabled={isSubmitting || !text.trim()}
        className="self-end bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        size="sm"
      >
        {isSubmitting ? 'Posting...' : 'Add Note'}
      </Button>
    </form>
  )
}
