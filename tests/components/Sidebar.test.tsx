import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';
import type { Question, Filters } from '@/lib/types';

describe('Sidebar', () => {
  const sampleQuestions: Question[] = [
    {
      id: '1',
      topic: 'Java',
      subtopic: 'Concurrency',
      question: 'What are virtual threads?',
      answer: 'Lightweight threads',
      type: 'CONCEPTUAL',
      starter_code: null,
      skills: ['Java 21'],
      roles: ['Backend'],
      min_experience: 3,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      topic: 'React',
      subtopic: 'State',
      question: 'What is useState?',
      answer: 'State hook',
      type: 'CODING',
      starter_code: null,
      skills: ['React Hooks'],
      roles: ['Frontend'],
      min_experience: 1,
      created_at: new Date().toISOString(),
    },
  ];

  const defaultFilters: Filters = { search: '', role: '', skills: [], minExperience: 0 };

  it('renders search and topics correctly', () => {
    const onFiltersChange = vi.fn();
    const onSelect = vi.fn();
    const onSelectGroup = vi.fn();

    render(
      <Sidebar
        questions={sampleQuestions}
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        selectedId={null}
        onSelect={onSelect}
        onSelectGroup={onSelectGroup}
      />
    );

    expect(screen.getByPlaceholderText('Search titles & answers...')).toBeInTheDocument();
    expect(screen.getByText('Java')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('triggers onFiltersChange when typing search', () => {
    const onFiltersChange = vi.fn();
    render(
      <Sidebar
        questions={sampleQuestions}
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        selectedId={null}
        onSelect={() => {}}
        onSelectGroup={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search titles & answers...');
    fireEvent.change(searchInput, { target: { value: 'threads' } });
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'threads' }));
  });

  it('selects question when clicked', () => {
    const onSelect = vi.fn();
    render(
      <Sidebar
        questions={sampleQuestions}
        filters={defaultFilters}
        onFiltersChange={() => {}}
        selectedId={null}
        onSelect={onSelect}
        onSelectGroup={() => {}}
      />
    );

    fireEvent.click(screen.getByText('What are virtual threads?'));
    expect(onSelect).toHaveBeenCalledWith(sampleQuestions[0]);
  });

  it('toggles skill filter when skill pill is clicked', () => {
    const onFiltersChange = vi.fn();
    render(
      <Sidebar
        questions={sampleQuestions}
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        selectedId={null}
        onSelect={() => {}}
        onSelectGroup={() => {}}
      />
    );

    const skillButton = screen.getByText('React Hooks');
    fireEvent.click(skillButton);
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ skills: ['React Hooks'] }));
  });

  it('clears all filters when Clear button is clicked', () => {
    const onFiltersChange = vi.fn();
    const activeFilters: Filters = { search: 'test', role: 'Backend', skills: ['Java 21'], minExperience: 2 };
    render(
      <Sidebar
        questions={sampleQuestions}
        filters={activeFilters}
        onFiltersChange={onFiltersChange}
        selectedId={null}
        onSelect={() => {}}
        onSelectGroup={() => {}}
      />
    );

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    expect(onFiltersChange).toHaveBeenCalledWith({ search: '', role: '', skills: [], minExperience: 0 });
  });
});
