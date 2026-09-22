-- Extend durable learner evidence to include review outcomes.
-- This is additive: historical migration 0005 remains immutable.

alter table blossom_learning_submission
  drop constraint if exists blossom_learning_submission_kind_check;

alter table blossom_learning_submission
  add constraint blossom_learning_submission_kind_check
  check (kind in ('grammar', 'listening', 'writing', 'review'));
