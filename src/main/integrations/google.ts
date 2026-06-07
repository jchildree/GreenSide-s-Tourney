import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../auth/oauth-config'
import type { Tourney, Signups, Player } from '../../shared/types'
import { refreshAccessToken } from './token-refresh'
import { findNameQuestion, findDiscordQuestion } from './google-form-utils'

const FORMS_BASE = 'https://forms.googleapis.com/v1/forms'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

async function getToken(refreshToken: string): Promise<string> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured in oauth-config.ts')
  }
  return refreshAccessToken({
    tokenUrl: TOKEN_URL,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    refreshToken,
    serviceName: 'Google',
  })
}

interface UpdateFormParams {
  refreshToken: string
  formId: string
  tourney: Tourney
}

interface FetchSignupsParams {
  refreshToken: string
  formId: string
}

interface FormItem {
  title?: string
  questionItem?: { question: { questionId: string } }
}

interface FormResponse {
  responseId: string
  createTime: string
  answers?: Record<string, {
    textAnswers?: { answers: { value: string }[] }
  }>
}

function fmtDate(iso: string): string {
  if (!iso) return 'TBD'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export async function updateGoogleForm(params: UpdateFormParams): Promise<void> {
  const { refreshToken, formId, tourney } = params
  const accessToken = await getToken(refreshToken)

  const description = [
    `Game: ${tourney.game || 'TBD'}`,
    `Tournament Date: ${fmtDate(tourney.dateTime)}`,
    `Signup Deadline: ${fmtDate(tourney.signupDeadline)}`,
    `Players: ${tourney.minPlayers}-${tourney.maxPlayers}`,
  ].join('\n')

  const resp = await fetch(`${FORMS_BASE}/${encodeURIComponent(formId)}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        updateFormInfo: {
          info: {
            title: tourney.name || 'Tournament Signup',
            description,
          },
          updateMask: 'title,description',
        },
      }],
    }),
  })

  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Google Forms update failed (${resp.status}): ${body}`)
  }
}

export async function fetchSignups(params: FetchSignupsParams): Promise<Signups> {
  const { refreshToken, formId } = params
  const accessToken = await getToken(refreshToken)

  const formResp = await fetch(`${FORMS_BASE}/${encodeURIComponent(formId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!formResp.ok) {
    const body = await formResp.text()
    throw new Error(`Failed to fetch form info (${formResp.status}): ${body}`)
  }
  const form = (await formResp.json()) as { items?: FormItem[] }

  const questions = (form.items ?? [])
    .filter((item): item is FormItem & { questionItem: NonNullable<FormItem['questionItem']> } =>
      item.questionItem !== undefined
    )
    .map(item => ({
      id: item.questionItem.question.questionId,
      title: (item.title ?? '').toLowerCase(),
    }))

  const nameQ = findNameQuestion(questions)
  const discordQ = findDiscordQuestion(questions)

  const responsesResp = await fetch(`${FORMS_BASE}/${encodeURIComponent(formId)}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!responsesResp.ok) {
    const body = await responsesResp.text()
    throw new Error(`Failed to fetch form responses (${responsesResp.status}): ${body}`)
  }
  const data = (await responsesResp.json()) as { responses?: FormResponse[] }

  return (data.responses ?? []).map((r): Player => {
    const get = (qId: string | undefined): string => {
      if (!qId || !r.answers?.[qId]) return ''
      return r.answers[qId].textAnswers?.answers[0]?.value ?? ''
    }
    return {
      name: get(nameQ?.id),
      discordHandle: get(discordQ?.id),
      submittedAt: r.createTime,
    }
  })
}
