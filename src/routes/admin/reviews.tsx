import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { apiQuery, apiUpdate, apiDelete, apiLogCommunityActivity } from '@/lib/api-client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Eye, Trash2, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/reviews')({
  component: AdminReviewsPage,
})

type SortField = 'created_at' | 'status'
type SortDir = 'asc' | 'desc'

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30',
  draft: 'bg-muted text-muted-foreground hover:bg-muted/80',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function AdminReviewsPage() {
  const { accessToken } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Record<string, unknown> | null>(null)
  const [deleting, setDeleting] = useState(false)
  const PAGE_SIZE = 20

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const res = await apiQuery('peer_reviews', {
        select: 'id,submission_url,reviewer_id,reviewee_id,feedback,suggestions,positives,status,points_awarded,created_at,updated_at',
        order: { column: 'created_at', ascending: false },
      })
      return (res.data || []) as Record<string, unknown>[]
    },
    enabled: !!accessToken,
  })

  const { data: profilesData } = useQuery({
    queryKey: ['admin-review-profiles'],
    queryFn: async () => {
      const res = await apiQuery('profiles', {
        select: 'user_id,full_name,avatar_url',
      })
      return (res.data || []) as Record<string, unknown>[]
    },
    enabled: !!accessToken,
  })

  const profileMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>()
    if (profilesData) {
      for (const p of profilesData) {
        map.set(p.user_id as string, p)
      }
    }
    return map
  }, [profilesData])

  const reviews = useMemo(() => {
    if (!reviewsData) return []
    let result = [...reviewsData]

    if (search) {
      const lower = search.toLowerCase()
      result = result.filter((r) => {
        const reviewerProf = profileMap.get(r.reviewer_id as string)
        const revieweeProf = profileMap.get(r.reviewee_id as string)
        const subUrl = (r.submission_url as string || '').toLowerCase()
        return (
          subUrl.includes(lower) ||
          (reviewerProf?.full_name as string || '').toLowerCase().includes(lower) ||
          (revieweeProf?.full_name as string || '').toLowerCase().includes(lower)
        )
      })
    }

    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'created_at') {
        cmp = new Date((a.created_at as string) || '').getTime() - new Date((b.created_at as string) || '').getTime()
      } else {
        cmp = String(a.status || '').localeCompare(String(b.status || ''))
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [reviewsData, search, statusFilter, sortField, sortDir, profileMap])

  const totalPages = Math.ceil(reviews.length / PAGE_SIZE)
  const pagedReviews = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async () => {
    if (!selectedReview) return
    setDeleting(true)
    try {
      await apiDelete('peer_reviews', { id: selectedReview.id as string })
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      toast.success('Review deleted')
      setDeleteOpen(false)
      setSelectedReview(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const overrideMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!selectedReview) throw new Error('No review selected')
      await apiUpdate('peer_reviews', { status: newStatus }, { id: selectedReview.id as string })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      toast.success('Review status updated')
      setViewOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Peer Reviews</h1>
          <p className="text-muted-foreground">Manage all peer review submissions</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or submission URL..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value === 'all' ? '' : value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reviewer</TableHead>
              <TableHead>Reviewee</TableHead>
              <TableHead>Submission URL</TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('status')}
                >
                  Status
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Points</TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort('created_at')}
                >
                  Date
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviewsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pagedReviews.length > 0 ? (
              pagedReviews.map((review) => {
                const reviewer = profileMap.get(review.reviewer_id as string)
                const reviewee = profileMap.get(review.reviewee_id as string)
                const revStatus = (review.status as string) || 'pending'

                return (
                  <TableRow key={review.id as string}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {(reviewer?.avatar_url as string) && (
                            <AvatarImage src={reviewer?.avatar_url as string} alt={reviewer?.full_name as string} />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {getInitials((reviewer?.full_name as string) || '?')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{(reviewer?.full_name as string) || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {(reviewee?.avatar_url as string) && (
                            <AvatarImage src={reviewee?.avatar_url as string} alt={reviewee?.full_name as string} />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {getInitials((reviewee?.full_name as string) || '?')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{(reviewee?.full_name as string) || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      <a
                        href={(review.submission_url as string) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(review.submission_url as string) || '-'}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[revStatus] || STATUS_COLORS.draft}>
                        {revStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {review.points_awarded ? '+5' : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {review.created_at
                        ? new Date(review.created_at as string).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedReview(review)
                            setViewOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedReview(review)
                            setDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No reviews found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(Math.max(1, page - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              if (pageNum > totalPages) return null
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink onClick={() => setPage(pageNum)} isActive={pageNum === page}>
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              Full peer review information and content.
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Reviewer</Label>
                  <p className="font-medium">
                    {(profileMap.get(selectedReview.reviewer_id as string)?.full_name as string) || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reviewee</Label>
                  <p className="font-medium">
                    {(profileMap.get(selectedReview.reviewee_id as string)?.full_name as string) || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={STATUS_COLORS[(selectedReview.status as string) || 'pending']}>
                    {(selectedReview.status as string) || 'pending'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Points Awarded</Label>
                  <p className="font-medium">{selectedReview.points_awarded ? 'Yes (+5)' : 'No'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Submission URL</Label>
                  <a
                    href={(selectedReview.submission_url as string) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block truncate"
                  >
                    {(selectedReview.submission_url as string) || '-'}
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Feedback</Label>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {(selectedReview.feedback as string) || 'No feedback provided'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Suggestions</Label>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {(selectedReview.suggestions as string) || 'No suggestions provided'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Positives</Label>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {(selectedReview.positives as string) || 'No positives noted'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Override Status</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedReview.status === 'pending' ? 'default' : 'outline'}
                    onClick={() => overrideMutation.mutate('pending')}
                    disabled={overrideMutation.isPending}
                  >
                    Mark Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedReview.status === 'completed' ? 'default' : 'outline'}
                    onClick={() => overrideMutation.mutate('completed')}
                    disabled={overrideMutation.isPending}
                  >
                    Mark Completed
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting...' : 'Delete Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


