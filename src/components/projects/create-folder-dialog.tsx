'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createFolder } from '@/actions/folder-actions';
import { useRouter } from 'next/navigation';

const createFolderSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  color: z.string().optional(),
});

type CreateFolderForm = z.infer<typeof createFolderSchema>;

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string;
}

const FOLDER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

export const CreateFolderDialog = ({ 
  open, 
  onOpenChange, 
  parentId 
}: CreateFolderDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CreateFolderForm>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: '',
      color: FOLDER_COLORS[0],
    },
  });

  const onSubmit = async (data: CreateFolderForm) => {
    setIsLoading(true);
    try {
      await createFolder({
        name: data.name,
        color: data.color,
        parentId,
      });
      
      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Pasta</DialogTitle>
          <DialogDescription>
            Crie uma nova pasta para organizar seus projetos.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da pasta</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o nome da pasta..." 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor da pasta</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {FOLDER_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            field.value === color 
                              ? 'border-foreground scale-110' 
                              : 'border-border hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                          disabled={isLoading}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Pasta'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};