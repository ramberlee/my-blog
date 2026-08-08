import React, { useState, useEffect } from 'react'
import { useToast } from './Toast'
import { configApi, authApi, uploadApi, resolveAssetUrl, type SiteConfig } from '../utils/api'

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text-heading)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.25s' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6, letterSpacing: '0.01em' }

const ConfigManager: React.FC = () => {
  const { toast } = useToast()
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<SiteConfig | null>(null)
  const [showPwChange, setShowPwChange] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pwForm, setPwForm] = useState({ oldPw: '', newPw: '', confirmPw: '' })

  useEffect(() => {
    configApi.get()
      .then(c => { setConfig(c); setEditForm(c) })
      .catch(e => toast('加载配置失败: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!editForm) return
    try { const updated = await configApi.update(editForm); setConfig(updated); setIsEditing(false); toast('配置已保存', 'success') }
    catch (e: any) { toast('保存失败: ' + e.message, 'error') }
  }

  const handleReset = async () => {
    if (confirm('确定要重置所有配置吗？')) {
      try { const reset = await configApi.reset(); setConfig(reset); setEditForm(reset); setIsEditing(false); toast('配置已重置', 'info') }
      catch (e: any) { toast('重置失败: ' + e.message, 'error') }
    }
  }

  const handlePwChange = async () => {
    if (!pwForm.oldPw || !pwForm.newPw) { toast('请填写所有字段', 'error'); return }
    if (pwForm.newPw.length < 6) { toast('新密码至少6位', 'error'); return }
    if (pwForm.newPw !== pwForm.confirmPw) { toast('两次密码不一致', 'error'); return }
    try { await authApi.changePassword(pwForm.oldPw, pwForm.newPw); toast('密码已修改', 'success'); setPwForm({ oldPw: '', newPw: '', confirmPw: '' }); setShowPwChange(false) }
    catch (e: any) { toast(e.message || '修改失败', 'error') }
  }


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editForm) return
    setUploading(true)
    try {
      const { url } = await uploadApi.image(file)
      setEditForm({ ...editForm, author: { ...editForm.author, avatar: url } })
      toast('头像上传成功', 'success')
    } catch (err: any) {
      toast(err.message || '上传失败', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loading || !config || !editForm) {
    return (
      <div className="glass" style={{ borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <div className="mx-auto mb-4 rounded-full animate-spin" style={{ width: 32, height: 32, border: '2px solid var(--c-border)', borderTopColor: 'var(--c-accent)' }} />
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>加载配置中...</p>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="glass" style={{ borderRadius: 16, padding: 32 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text-heading)' }}>编辑配置</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-heading)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--c-border)' }}>基本信息</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={labelStyle}>网站名称</label><input type="text" value={editForm.siteName} onChange={e => setEditForm({ ...editForm, siteName: e.target.value })} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
              <div><label style={labelStyle}>网站描述</label><input type="text" value={editForm.siteDescription} onChange={e => setEditForm({ ...editForm, siteDescription: e.target.value })} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-heading)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--c-border)' }}>作者信息</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={labelStyle}>作者名称</label><input type="text" value={editForm.author.name} onChange={e => setEditForm({ ...editForm, author: { ...editForm.author, name: e.target.value } })} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
              <div>
                <label style={labelStyle}>头像</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--c-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', opacity: uploading ? 0.6 : 1, transition: 'opacity 0.25s' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {uploading ? '上传中...' : '上传图片'}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={uploading} />
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>或输入 URL</span>
                </div>
                <input type="text" value={editForm.author.avatar || ''} onChange={e => setEditForm({ ...editForm, author: { ...editForm.author, avatar: e.target.value } })} style={inputStyle} placeholder="https://..." onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
              <div><label style={labelStyle}>作者简介</label><input type="text" value={editForm.author.bio} onChange={e => setEditForm({ ...editForm, author: { ...editForm.author, bio: e.target.value } })} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
              <div><label style={labelStyle}>邮箱</label><input type="email" value={editForm.author.email} onChange={e => setEditForm({ ...editForm, author: { ...editForm.author, email: e.target.value } })} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-heading)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--c-border)' }}>社交链接</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={labelStyle}>GitHub</label><input type="text" value={editForm.author.social.github || ''} onChange={e => setEditForm({ ...editForm, author: { ...editForm.author, social: { ...editForm.author.social, github: e.target.value } } })} style={inputStyle} placeholder="https://github.com/username" onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
              <div><label style={labelStyle}>Twitter</label><input type="text" value={editForm.author.social.twitter || ''} onChange={e => setEditForm({ ...editForm, author: { ...editForm.author, social: { ...editForm.author.social, twitter: e.target.value } } })} style={inputStyle} placeholder="https://twitter.com/username" onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
              <div><label style={labelStyle}>微博</label><input type="text" value={editForm.author.social.weibo || ''} onChange={e => setEditForm({ ...editForm, author: { ...editForm.author, social: { ...editForm.author.social, weibo: e.target.value } } })} style={inputStyle} placeholder="https://weibo.com/username" onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 8 }}>
            <button onClick={handleSave} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--c-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' }}>保存配置</button>
            <button onClick={() => { setEditForm(config); setIsEditing(false) }} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)' }}>取消</button>
            <button onClick={handleReset} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)', marginLeft: 'auto' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#f87171' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)' }}>重置配置</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass" style={{ borderRadius: 16, padding: 32 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" stroke="var(--c-accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text-heading)' }}>网站配置</h3>
        </div>
        <button onClick={() => { setEditForm(config); setIsEditing(true) }} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.25s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-accent-border)'; e.currentTarget.style.color = 'var(--c-accent)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          编辑配置
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>基本信息</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>网站名称</div><div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text-heading)' }}>{config.siteName}</div></div>
            <div><div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>网站描述</div><div style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.6 }}>{config.siteDescription}</div></div>
          </div>
        </div>
        <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>作者信息</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>作者</div><div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text-heading)' }}>{config.author.name}</div></div>
            {config.author.avatar && <div style={{ marginBottom: 8 }}><img src={resolveAssetUrl(config.author.avatar)} alt={config.author.name} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', marginBottom: 8, border: '1px solid var(--c-border)' }} /><div style={{ fontSize: 12, color: 'var(--c-text-muted)', wordBreak: 'break-all' }}>{config.author.avatar}</div></div>}
            <div><div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>简介</div><div style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.6 }}>{config.author.bio}</div></div>
            <div><div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>邮箱</div><div style={{ fontSize: 14, color: 'var(--c-text)' }}>{config.author.email}</div></div>
          </div>
        </div>
        <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>社交链接</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {config.author.social.github && <div><div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>GitHub</div><div style={{ fontSize: 14, color: 'var(--c-text)' }}>{config.author.social.github}</div></div>}
            {config.author.social.twitter && <div><div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>Twitter</div><div style={{ fontSize: 14, color: 'var(--c-text)' }}>{config.author.social.twitter}</div></div>}
            {config.author.social.weibo && <div><div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>微博</div><div style={{ fontSize: 14, color: 'var(--c-text)' }}>{config.author.social.weibo}</div></div>}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPwChange ? 20 : 0 }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-heading)', marginBottom: 4 }}>修改密码</h4>
            <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>更改后台管理登录密码</p>
          </div>
          <button onClick={() => setShowPwChange(!showPwChange)} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--c-border)', fontFamily: 'var(--font-body)', transition: 'all 0.25s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-accent-border)'; e.currentTarget.style.color = 'var(--c-accent)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)' }}>
            {showPwChange ? '收起' : '修改密码'}
          </button>
        </div>
        {showPwChange && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
            <div><label style={labelStyle}>原密码</label><input type="password" value={pwForm.oldPw} onChange={e => setPwForm({ ...pwForm, oldPw: e.target.value })} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
            <div><label style={labelStyle}>新密码（至少6位）</label><input type="password" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
            <div><label style={labelStyle}>确认新密码</label><input type="password" value={pwForm.confirmPw} onChange={e => setPwForm({ ...pwForm, confirmPw: e.target.value })} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent-border)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} /></div>
            <div><button onClick={handlePwChange} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--c-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' }}>确认修改</button></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfigManager
