import { open } from '@tauri-apps/plugin-dialog';
import { ScrcpyConfig } from '../hooks/useScrcpy';
import Tooltip from './Tooltip';
import { Coffee, MonitorOff, Volume2, Layers, Maximize, Square, Circle, Folder, Settings2 } from 'lucide-react';
import { useI18n } from '../i18n';

interface SessionBehaviorProps {
    config: ScrcpyConfig;
    setConfig: (c: ScrcpyConfig) => void;
}

export default function SessionBehavior({ config, setConfig }: SessionBehaviorProps) {
    const { t } = useI18n();

    const handleChange = (field: keyof ScrcpyConfig, value: any) => {
        const newConfig = { ...config, [field]: value };
        setConfig(newConfig);
        if (field === 'recordPath') {
            localStorage.setItem('scrcpy_record_path', value);
        }
    };

    const handlePickFolder = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: t('sessionBehavior.selectRecordingFolderTitle')
            });
            if (selected) {
                handleChange('recordPath', selected);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const Toggle = ({ checked, onChange, icon: Icon, label, tooltip, danger = false }: { checked: boolean, onChange: (v: boolean) => void, icon: any, label: string, tooltip: string, danger?: boolean }) => (
        <div
            onClick={() => onChange(!checked)}
            className="flex items-center justify-between gap-3 group cursor-pointer py-1 bg-zinc-950/30 rounded-lg px-2 border border-transparent hover:border-zinc-800 transition-all"
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1 rounded-md shrink-0 transition-colors ${checked ? (danger ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary') : 'bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300'}`}>
                    <Icon size={12} />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-tight truncate transition-colors ${checked ? (danger ? 'text-red-400' : 'text-zinc-200') : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                        {label}
                    </span>
                    <div className="shrink-0">
                        <Tooltip text={tooltip} />
                    </div>
                </div>
            </div>
            <div className={`w-6 h-3.5 shrink-0 rounded-full p-0.5 transition-all duration-300 ${checked ? (danger ? 'bg-red-600' : 'bg-primary') : 'bg-zinc-800'}`}>
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm transition-all duration-300 ${checked ? (danger ? 'bg-white translate-x-2.5' : 'bg-[var(--text-on-primary)] translate-x-2.5') : 'bg-white translate-x-0'}`} />
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="glass p-3.5 rounded-2xl space-y-2 border border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
                <div className="flex items-center gap-2 border-b border-zinc-800/50 pb-1.5 mb-1">
                    <Settings2 size={12} className="text-zinc-500" />
                    <h2 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{t('sessionBehavior.title')}</h2>
                </div>

                <div className="flex flex-col gap-1">
                    <Toggle
                        checked={config.stayAwake || false}
                        onChange={(v) => handleChange('stayAwake', v)}
                        icon={Coffee}
                        label={t('sessionBehavior.stayAwake')}
                        tooltip={t('sessionBehavior.stayAwakeTooltip')}
                    />
                    <Toggle
                        checked={config.turnOff || false}
                        onChange={(v) => handleChange('turnOff', v)}
                        icon={MonitorOff}
                        label={t('sessionBehavior.screenOff')}
                        tooltip={t('sessionBehavior.screenOffTooltip')}
                    />
                    <Toggle
                        checked={config.audioEnabled || false}
                        onChange={(v) => handleChange('audioEnabled', v)}
                        icon={Volume2}
                        label={t('sessionBehavior.forwardAudio')}
                        tooltip={t('sessionBehavior.forwardAudioTooltip')}
                    />
                    <Toggle
                        checked={config.alwaysOnTop || false}
                        onChange={(v) => handleChange('alwaysOnTop', v)}
                        icon={Layers}
                        label={t('sessionBehavior.alwaysOnTop')}
                        tooltip={t('sessionBehavior.alwaysOnTopTooltip')}
                    />
                    <Toggle
                        checked={config.fullscreen || false}
                        onChange={(v) => handleChange('fullscreen', v)}
                        icon={Maximize}
                        label={t('sessionBehavior.fullScreen')}
                        tooltip={t('sessionBehavior.fullScreenTooltip')}
                    />
                    <Toggle
                        checked={config.borderless || false}
                        onChange={(v) => handleChange('borderless', v)}
                        icon={Square}
                        label={t('sessionBehavior.borderless')}
                        tooltip={t('sessionBehavior.borderlessTooltip')}
                    />
                    <Toggle
                        checked={config.record || false}
                        onChange={(v) => handleChange('record', v)}
                        icon={Circle}
                        label={t('sessionBehavior.recordFeed')}
                        tooltip={t('sessionBehavior.recordFeedTooltip')}
                        danger={true}
                    />
                </div>

                <div className="pt-2 border-t border-zinc-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Folder size={12} className="text-zinc-500" />
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">{t('sessionBehavior.recordPath')}</span>
                        </div>
                        <button
                            onClick={handlePickFolder}
                            className="text-[8px] font-black uppercase text-primary hover:text-white transition-colors"
                        >
                            {t('sessionBehavior.change')}
                        </button>
                    </div>
                    <div className="bg-black/40 border border-zinc-800/50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[9px] text-zinc-500 font-mono truncate leading-none">
                            {config.recordPath || t('sessionBehavior.defaultVideosFolder')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
