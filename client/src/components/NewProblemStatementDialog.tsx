import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronRight, AlertCircle, BookOpen } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface NewProblemStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventureId: string;
  onSuccess?: () => void;
}

export function NewProblemStatementDialog({
  open,
  onOpenChange,
  ventureId,
  onSuccess,
}: NewProblemStatementDialogProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'Validated' | 'Draft'>('Draft');
  const [contact, setContact] = useState('');
  const [sampleSize, setSampleSize] = useState('');
  const [hypothesisInput, setHypothesisInput] = useState('');
  const [evidenceCriteria, setEvidenceCriteria] = useState('');
  const [showHypotheses, setShowHypotheses] = useState(false);

  const createProblemStatement = trpc.ventures.createProblemStatement.useMutation();
  const getContextualGuidance = trpc.contextual.getContextualGuidance.useQuery(
    { ventureId, module: 'venture_intake', context: 'problem_statement' },
    { enabled: open }
  );

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Problem statement title is required');
      return;
    }

    try {
      await createProblemStatement.mutateAsync({
        ventureId,
        title,
        status,
        contact,
        sampleSize: sampleSize ? parseInt(sampleSize) : undefined,
        hypothesisInput,
        evidenceCriteria,
      });

      toast.success('Problem statement created successfully');
      setTitle('');
      setStatus('Draft');
      setContact('');
      setSampleSize('');
      setHypothesisInput('');
      setEvidenceCriteria('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to create problem statement');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Problem Statement</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title and Status */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title" className="text-sm font-semibold">
                Problem Statement
              </Label>
              <Input
                id="title"
                placeholder="Enter problem statement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-sm font-semibold">Status</Label>
              <div className="flex gap-2">
                {(['Validated', 'Draft'] as const).map((s) => (
                  <Badge
                    key={s}
                    variant={status === s ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setStatus(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Contact and Evidence Criteria */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact" className="text-sm font-semibold">
                Contact
              </Label>
              <Input
                id="contact"
                placeholder="Contact person"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sampleSize" className="text-sm font-semibold">
                Sample Size
              </Label>
              <Input
                id="sampleSize"
                type="number"
                placeholder="n = 1"
                value={sampleSize}
                onChange={(e) => setSampleSize(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Evidence Criteria */}
          <div>
            <Label htmlFor="evidenceCriteria" className="text-sm font-semibold">
              Evidence Criteria
            </Label>
            <Textarea
              id="evidenceCriteria"
              placeholder="Define the evidence criteria for this problem statement"
              value={evidenceCriteria}
              onChange={(e) => setEvidenceCriteria(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Hypothesis Input */}
          <div>
            <Label htmlFor="hypothesis" className="text-sm font-semibold">
              Hypothesis Input
            </Label>
            <Textarea
              id="hypothesis"
              placeholder="Enter your hypothesis"
              value={hypothesisInput}
              onChange={(e) => setHypothesisInput(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
            <button
              onClick={() => setShowHypotheses(!showHypotheses)}
              className="text-xs text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-1"
            >
              View Hypotheses <ChevronRight size={14} />
            </button>
          </div>

          {/* Contextual Guidance */}
          <Card className="bg-amber-50 border-amber-200 p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Evidence Gaps</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    {getContextualGuidance.data?.evidenceGaps || 'No evidence gaps identified yet'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <BookOpen size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Playbook Guidance</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    {getContextualGuidance.data?.playbookGuidance || 'No guidance available yet'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createProblemStatement.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {createProblemStatement.isPending ? 'Creating...' : 'Create Problem Statement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
