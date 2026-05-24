import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../auth/oauth-config'
import type { Tourney, Signups, Player } from '../../shared/types'

const FORMS_BASE = 'https://forms.googleapis.com/v1/forms'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

async function getAccessToken(refreshToken: string): Promise<string> {
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
    }),
  })
  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Google token refresh failed (${resp.status}): ${body}`)
  }
  const data = (await resp.json()) as { access_token: string }
  if (!data.access_token) throw new Error('Google did not return an access token')
  return data.access_token
}

interface UpdateFormParams {
  oauthToken: string
  formId: string
  tourney: Tourney
}

interface FetchSignupsParams {
  oauthToken: string
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
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export async function updateGoogleForm(params: UpdateFormParams): Promise<void> {
  const { oauthToken, formId, tourney } = params
  const accessToken = await getAccessToken(oauthToken)

  const description = [
    `Game: ${tourney.game || 'TBD'}`,
    `Tournament Date: ${fmtDate(tourney.dateTime)}`,
    `Signup Deadline: ${fmtDate(tourney.signupDeadline)}`,
    `Players: ${tourney.minPlayers}–${tourney.maxPlayers}`,
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
  const { oauthToken, formId } = params
  const accessToken = await getAccessToken(oauthToken)

  // Fetch form structure to resolve question IDs by title
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

  const nameQ = questions.find(q => q.title.includes('name'))
  const discordQ = questions.find(q => q.title.includes('discord'))

  // Fetch all responses
  const respResp = await fetch(`${FORMS_BASE}/${encodeURIComponent(formId)}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!respResp.ok) {
    const body = await respResp.text()
    throw new Error(`Failed to fetch form responses (${respResp.status}): ${body}`)
  }
  const data = (await respResp.json()) as { responses?: FormResponse[] }

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
