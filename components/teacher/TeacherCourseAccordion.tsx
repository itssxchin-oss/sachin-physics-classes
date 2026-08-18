"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Play, FolderPlus, Video } from "lucide-react";
import DeleteCourseButton from "@/components/ui/DeleteCourseButton";
import DeleteChapterButton from "@/components/ui/DeleteChapterButton";
import DeleteLectureButton from "@/components/ui/DeleteLectureButton";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  created_at: string;
}

interface Chapter {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_number: number;
}

interface Lecture {
  id: string;
  course_id: string;
  chapter_id: string | null;
  title: string;
  description: string;
  youtube_url: string;
  order_number: number;
  duration_mins: number | null;
}

interface TeacherCourseAccordionProps {
  courses: Course[];
  chapters: Chapter[];
  lectures: Lecture[];
}

export default function TeacherCourseAccordion({
  courses,
  chapters,
  lectures,
}: TeacherCourseAccordionProps) {
  // Keep track of which courses are expanded
  const [expandedCourseIds, setExpandedCourseIds] = useState<Record<string, boolean>>({});

  const toggleCourse = (courseId: string) => {
    setExpandedCourseIds((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 glass rounded-2xl border border-white/10">
        <span className="text-5xl block mb-4">📚</span>
        <h3 className="text-lg font-semibold text-white mb-2">No courses created yet</h3>
        <p className="text-slate-400 mb-4">Create your first physics course to get started.</p>
        <Link
          href="/teacher/courses/new"
          className="inline-block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all"
        >
          ＋ Add New Course
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((c) => {
        const isExpanded = !!expandedCourseIds[c.id];
        const courseChapters = chapters.filter((ch) => ch.course_id === c.id);
        const courseChapterIds = new Set(courseChapters.map((ch) => ch.id));
        const courseLectures = lectures.filter(
          (l) => (l.chapter_id && courseChapterIds.has(l.chapter_id)) || l.course_id === c.id
        );
        const unassignedLectures = lectures.filter(
          (l) => l.course_id === c.id && (!l.chapter_id || !courseChapterIds.has(l.chapter_id))
        );

        return (
          <div
            key={c.id}
            className="glass rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-blue-500/30"
          >
            {/* Main Course Bar */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => toggleCourse(c.id)}
              >
                <button
                  type="button"
                  aria-label={isExpanded ? "Collapse course" : "Expand course"}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Published
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      📂 {courseChapters.length} chapter{courseChapters.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">•</span>
                    <span className="text-xs text-slate-400 font-medium">
                      📹 {courseLectures.length} lecture{courseLectures.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base hover:text-blue-300 transition-colors">
                    {c.title}
                  </h3>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => toggleCourse(c.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-1"
                >
                  {isExpanded ? "Hide Hierarchy" : "View Hierarchy"}
                </button>

                <Link
                  href={`/courses/${c.id}`}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                >
                  View Public →
                </Link>

                <Link
                  href={`/teacher/courses/${c.id}/edit`}
                  aria-label={`Edit course ${c.title}`}
                  title="Edit course"
                  className="w-8 h-8 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 flex items-center justify-center transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </Link>

                <DeleteCourseButton courseId={c.id} courseTitle={c.title} />
              </div>
            </div>

            {/* Expanded Hierarchy Section */}
            {isExpanded && (
              <div className="border-t border-white/10 p-5 bg-slate-950/40 space-y-6 fade-up">
                {/* Header inside expanded view */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Course Hierarchy & Syllabus</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/teacher/chapters/new?course_id=${c.id}`}
                      className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <FolderPlus className="w-3.5 h-3.5" /> ＋ Add Chapter
                    </Link>
                    <Link
                      href={`/teacher/lectures/new?course_id=${c.id}`}
                      className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" /> ＋ Add Lecture
                    </Link>
                  </div>
                </div>

                {/* Chapters List */}
                {courseChapters.length > 0 ? (
                  <div className="space-y-4">
                    {courseChapters.map((ch) => {
                      const chapterLectures = lectures.filter((l) => l.chapter_id === ch.id);

                      return (
                        <div
                          key={ch.id}
                          className="glass p-4 rounded-xl border border-white/10 bg-white/[0.01] space-y-3"
                        >
                          {/* Chapter Header */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-xs flex items-center justify-center">
                                #{ch.order_number}
                              </span>
                              <div>
                                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                                  <span>{ch.title}</span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    ({chapterLectures.length} lecture{chapterLectures.length !== 1 ? "s" : ""})
                                  </span>
                                </h5>
                                {ch.description && (
                                  <p className="text-xs text-slate-400 mt-0.5">{ch.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Chapter Edit / Delete icons */}
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/teacher/chapters/${ch.id}/edit`}
                                aria-label={`Edit chapter ${ch.title}`}
                                title="Edit chapter"
                                className="w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 flex items-center justify-center transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Link>
                              <DeleteChapterButton chapterId={ch.id} chapterTitle={ch.title} />
                            </div>
                          </div>

                          {/* Lectures under this Chapter */}
                          <div className="pl-4 sm:pl-8 border-l-2 border-emerald-500/20 space-y-2 pt-1">
                            {chapterLectures.length > 0 ? (
                              chapterLectures.map((lec) => (
                                <div
                                  key={lec.id}
                                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <Link
                                      href={`/courses/${c.id}/lecture/${lec.id}`}
                                      aria-label={`Play lecture ${lec.title}`}
                                      title="Play lecture"
                                      className="w-7 h-7 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs flex-shrink-0 transition-all hover:scale-105"
                                    >
                                      <Play className="w-3.5 h-3.5 ml-0.5" />
                                    </Link>
                                    <div>
                                      <span className="text-[11px] text-indigo-400 font-semibold uppercase mr-2">
                                        Lec {lec.order_number}
                                      </span>
                                      <Link
                                        href={`/courses/${c.id}/lecture/${lec.id}`}
                                        className="text-xs font-semibold text-white hover:text-indigo-300 transition-colors"
                                      >
                                        {lec.title}
                                      </Link>
                                      {lec.duration_mins && (
                                        <span className="text-[10px] text-slate-400 ml-2">
                                          ⏱️ {lec.duration_mins}m
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Lecture Edit / Delete icons */}
                                  <div className="flex items-center gap-1.5">
                                    <Link
                                      href={`/teacher/lectures/${lec.id}/materials`}
                                      aria-label={`Materials for lecture ${lec.title}`}
                                      title="Lecture materials"
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 flex items-center gap-1 text-xs font-medium transition-all"
                                    >
                                      📎 Materials
                                    </Link>
                                    <Link
                                      href={`/teacher/lectures/${lec.id}/edit`}
                                      aria-label={`Edit lecture ${lec.title}`}
                                      title="Edit lecture"
                                      className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 flex items-center justify-center transition-all"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Link>
                                    <DeleteLectureButton
                                      lectureId={lec.id}
                                      lectureTitle={lec.title}
                                    />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-2 text-xs text-slate-500 italic">
                                No lectures added to this chapter yet.{" "}
                                <Link
                                  href={`/teacher/lectures/new?course_id=${c.id}&chapter_id=${ch.id}`}
                                  className="text-indigo-400 hover:underline not-italic font-medium"
                                >
                                  ＋ Add Lecture
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 glass rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-2">No chapters created for this course yet.</p>
                    <Link
                      href={`/teacher/chapters/new?course_id=${c.id}`}
                      className="inline-block px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all"
                    >
                      ＋ Add First Chapter
                    </Link>
                  </div>
                )}

                {/* Unassigned lectures section if any exist */}
                {unassignedLectures.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Other Course Lectures (Unassigned to Chapter)
                    </h5>
                    <div className="space-y-2">
                      {unassignedLectures.map((lec) => (
                        <div
                          key={lec.id}
                          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/courses/${c.id}/lecture/${lec.id}`}
                              aria-label={`Play lecture ${lec.title}`}
                              title="Play lecture"
                              className="w-7 h-7 rounded-md bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs flex-shrink-0 transition-all hover:scale-105"
                            >
                              <Play className="w-3.5 h-3.5 ml-0.5" />
                            </Link>
                            <div>
                              <Link
                                href={`/courses/${c.id}/lecture/${lec.id}`}
                                className="text-xs font-semibold text-white hover:text-amber-300 transition-colors"
                              >
                                {lec.title}
                              </Link>
                              {lec.duration_mins && (
                                <span className="text-[10px] text-slate-400 ml-2">
                                  ⏱️ {lec.duration_mins}m
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/teacher/lectures/${lec.id}/materials`}
                              aria-label={`Materials for lecture ${lec.title}`}
                              title="Lecture materials"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 flex items-center gap-1 text-xs font-medium transition-all"
                            >
                              📎 Materials
                            </Link>
                            <Link
                              href={`/teacher/lectures/${lec.id}/edit`}
                              aria-label={`Edit lecture ${lec.title}`}
                              title="Edit lecture"
                              className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 flex items-center justify-center transition-all"
                            >
                              <Pencil className="w-3 h-3" />
                            </Link>
                            <DeleteLectureButton lectureId={lec.id} lectureTitle={lec.title} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
