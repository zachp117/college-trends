-- Drop the old list-of-list model in favor of a flat student → schools relation.
DROP TABLE IF EXISTS `list_item`;
--> statement-breakpoint
DROP TABLE IF EXISTS `school_list`;
--> statement-breakpoint
ALTER TABLE `student` ADD `graduation_year` integer;
--> statement-breakpoint
CREATE TABLE `student_school` (
  `id` text PRIMARY KEY NOT NULL,
  `student_id` text NOT NULL,
  `school_id` integer NOT NULL,
  `school_name` text NOT NULL,
  `tier` text,
  `status` text,
  `note` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON UPDATE no action ON DELETE cascade
);
