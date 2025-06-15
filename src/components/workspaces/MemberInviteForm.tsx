
import React from 'react';
import { SubmitHandler, Controller, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';

export interface InviteFormInputs {
  email: string;
  role: 'admin' | 'member' | 'guest';
}

interface MemberInviteFormProps {
  form: UseFormReturn<InviteFormInputs>;
  onSubmit: SubmitHandler<InviteFormInputs>;
  isSubmitting: boolean;
}

export function MemberInviteForm({ form, onSubmit, isSubmitting }: MemberInviteFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = form;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Invite New Member</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
        <div className="flex-grow">
          <Input
            {...register('email', { 
              required: 'Email is required', 
              pattern: { 
                value: /^\S+@\S+$/i, 
                message: 'Invalid email address' 
              } 
            })}
            placeholder="email@example.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <Controller
          name="role"
          control={control}
          defaultValue="member"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
          Invite
        </Button>
      </form>
    </div>
  );
}
