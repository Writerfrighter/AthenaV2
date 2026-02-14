import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface FormSubmitButtonsProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onClear: () => void;
  onSubmit: () => void;
  submitText: string;
  updateText: string;
}

export function FormSubmitButtons({
  isEditMode,
  isSubmitting,
  onCancel,
  onClear,
  onSubmit,
  submitText,
  updateText,
}: FormSubmitButtonsProps) {
  return (
    <Card className="border rounded-xl shadow-sm sm:py-4">
      <CardContent className="">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {isEditMode ? 'Update the entry and return to dashboard' : 'Data saves locally and syncs automatically'}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            {isEditMode ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="hover:bg-green-50 h-10"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="min-w-[140px] h-10 bg-green-600 hover:bg-green-700 text-base"
                  size="lg"
                >
                  {isSubmitting ? "Updating..." : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {updateText}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClear}
                  className="hover:bg-green-50 h-10"
                  size="lg"
                >
                  Clear Form
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="min-w-[140px] h-10 bg-green-600 hover:bg-green-700 text-base"
                  size="lg"
                >
                  {isSubmitting ? "Saving..." : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {submitText}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}