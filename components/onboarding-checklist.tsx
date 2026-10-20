"use client"

import { useState } from "react"
import {
  ArrowRightCircleIcon,
  CheckCircle2Icon,
  PauseCircleIcon,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type SectionStatus = "up-next" | "on-hold" | "done"

const statusConfig: Record<
  SectionStatus,
  { icon: typeof CheckCircle2Icon; label: string; className: string }
> = {
  "up-next": {
    icon: ArrowRightCircleIcon,
    label: "Up next",
    className: "text-primary",
  },
  "on-hold": {
    icon: PauseCircleIcon,
    label: "On hold",
    className: "text-muted-foreground",
  },
  done: {
    icon: CheckCircle2Icon,
    label: "Done",
    className: "text-green-600",
  },
}

const sections = [
  {
    id: "onboarding",
    title: "Onboarding",
    status: "up-next" as SectionStatus,
    tasks: [
      { label: "Complete your onboarding questionnaire", link: "onboarding" },
      { label: "Invite your team members" },
      { label: "Connect your Google Business Profile" },
      { label: "Review your notification preferences" },
    ],
  },
  {
    id: "website",
    title: "Website",
    status: "on-hold" as SectionStatus,
    tasks: [
      { label: "Choose your website template" },
      { label: "Add your logo and brand colors" },
      { label: "Connect your custom domain" },
      { label: "Publish your website" },
    ],
  },
  {
    id: "ai-receptionist",
    title: "AI Fall Back Receptionist",
    status: "on-hold" as SectionStatus,
    tasks: [
      { label: "Set your business hours" },
      { label: "Record or upload your greeting" },
      { label: "Configure call forwarding rules" },
      { label: "Test the AI receptionist with a practice call" },
    ],
  },
  {
    id: "reputation",
    title: "Reputation Management",
    status: "on-hold" as SectionStatus,
    tasks: [
      { label: "Connect your review platforms" },
      { label: "Set up review request templates" },
      { label: "Configure review alerts" },
      { label: "Respond to your first review" },
    ],
  },
]

export function OnboardingChecklist({
  locationId,
}: {
  locationId?: string | null
}) {
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})

  const onboardingUrl = locationId
    ? `https://www.kickbord.com/onboarding?location=${encodeURIComponent(locationId)}`
    : "https://www.kickbord.com/onboarding"

  const toggleTask = (sectionId: string, task: string, checked: boolean) => {
    setCheckedTasks((prev) => ({ ...prev, [`${sectionId}:${task}`]: checked }))
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to Kickbord
        </h1>
        <p className="text-muted-foreground mt-1">
          Let&apos;s get your business set up. Work through the sections below —
          your progress is saved as you go.
        </p>
      </div>
      <Accordion defaultValue={["onboarding"]} multiple className="gap-3">
        {sections.map((section) => {
          const completed = section.tasks.filter(
            (task) => checkedTasks[`${section.id}:${task}`]
          ).length
          const status: SectionStatus =
            completed === section.tasks.length ? "done" : section.status
          const StatusIcon = statusConfig[status].icon

          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="bg-muted/50 rounded-lg border-none px-4"
            >
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <StatusIcon
                    className={`size-5 shrink-0 ${statusConfig[status].className}`}
                    aria-label={statusConfig[status].label}
                  />
                  <span>{section.title}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {completed} of {section.tasks.length} done
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ul className="flex flex-col gap-3">
                  {section.tasks.map((task) => (
                    <li key={task.label} className="flex items-center gap-3">
                      <Checkbox
                        id={`${section.id}-${task.label}`}
                        checked={!!checkedTasks[`${section.id}:${task.label}`]}
                        onCheckedChange={(checked) =>
                          toggleTask(section.id, task.label, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`${section.id}-${task.label}`}
                        className="font-normal"
                      >
                        {task.link === "onboarding" ? (
                          <a
                            href={onboardingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-3 hover:text-foreground"
                          >
                            {task.label}
                          </a>
                        ) : (
                          task.label
                        )}
                      </Label>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
