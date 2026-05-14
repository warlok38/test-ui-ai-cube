'use client'

import { Alert, Button, Card, InputNumber, Select, Slider, Space, Typography } from 'antd'
import { useEffect, useMemo } from 'react'

import {
  DEFAULT_ASSISTANT_TECHNICAL_SETTINGS,
  TECHNICAL_DELAY_MAX_MS,
  TECHNICAL_DELAY_MIN_MS,
  TECHNICAL_SCENARIO_OPTIONS
} from '@/features/technical/model'
import { assistantActions } from '@/features/assistant/model/assistantSlice'
import { saveTechnicalSettings } from '@/modules/fakeDb/technicalSettingsPersistence'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

import styles from './TechnicalSettingsPage.module.css'

const minDelaySeconds = TECHNICAL_DELAY_MIN_MS / 1000
const maxDelaySeconds = TECHNICAL_DELAY_MAX_MS / 1000

export function TechnicalSettingsPage() {
  const dispatch = useAppDispatch()
  const technicalSettings = useAppSelector((s) => s.assistant.technicalSettings)

  const selectedScenarioMeta = useMemo(
    () => TECHNICAL_SCENARIO_OPTIONS.find((option) => option.value === technicalSettings.scenario),
    [technicalSettings.scenario]
  )

  useEffect(() => {
    saveTechnicalSettings(technicalSettings)
  }, [technicalSettings])

  const handleDelaySecondsChange = (seconds: number | null) => {
    const safeSeconds = typeof seconds === 'number' ? seconds : 0
    dispatch(assistantActions.setTechnicalStageDelayMs(safeSeconds * 1000))
  }

  const delaySeconds = Math.round(technicalSettings.stageDelayMs / 1000)

  return (
    <div className={styles.wrap}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Title level={2}>Техническая вкладка</Typography.Title>
        <Typography.Paragraph type="secondary">
          Настройки влияют на кнопку <Typography.Text code>Выполнить запрос</Typography.Text> в
          разделе главной и сохраняются локально в браузере.
        </Typography.Paragraph>

        <Card title="Сценарий ответа">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Select
              value={technicalSettings.scenario}
              options={TECHNICAL_SCENARIO_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              onChange={(value) => dispatch(assistantActions.setTechnicalScenario(value))}
            />
            <Typography.Paragraph className={styles.compactParagraph}>
              {selectedScenarioMeta?.summary ?? 'Описание сценария недоступно.'}
            </Typography.Paragraph>
          </Space>
        </Card>

        <Card title="Искусственная задержка этапов">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Paragraph className={styles.compactParagraph}>
              Применяется к каждому этапу: checking, generating, fetching, interpreting.
            </Typography.Paragraph>
            <Slider
              min={minDelaySeconds}
              max={maxDelaySeconds}
              step={1}
              value={delaySeconds}
              onChange={handleDelaySecondsChange}
            />
            <InputNumber
              min={minDelaySeconds}
              max={maxDelaySeconds}
              step={1}
              value={delaySeconds}
              addonAfter="сек"
              onChange={handleDelaySecondsChange}
            />
            <Typography.Text type="secondary">
              Текущее значение: {delaySeconds} сек (от 0 до 10 секунд).
            </Typography.Text>
          </Space>
        </Card>

        <Card title="Ошибки, которые можно проверить">
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Alert
              showIcon
              type="warning"
              message="input_warning"
              description="Пустой запрос: отправьте на главной строку только из пробелов."
            />
            <Alert
              showIcon
              type="error"
              message="server_unreachable"
              description="Выберите сценарий «Сервер недоступен» и выполните запрос."
            />
            <Alert
              showIcon
              type="error"
              message="failed_max (SOAP/empty)"
              description="Выберите сценарий «Ошибка SOAP на всех попытках» или «Пустой результат на всех попытках»."
            />
          </Space>
        </Card>

        <Space wrap>
          <Button onClick={() => dispatch(assistantActions.resetTechnicalSettings())}>
            Сбросить настройки
          </Button>
          <Button type="primary" href="/">
            Перейти на главную
          </Button>
        </Space>

        <Typography.Paragraph type="secondary">
          Базовый режим: сценарий{' '}
          <Typography.Text code>{DEFAULT_ASSISTANT_TECHNICAL_SETTINGS.scenario}</Typography.Text> и
          задержка <Typography.Text code>0 сек</Typography.Text>.
        </Typography.Paragraph>
      </Space>
    </div>
  )
}
