@echo off

echo ==========================================
echo �f�v���C���J�n���܂�...
echo ==========================================

:: 1. �r���h�����s
echo [1/3] �t�����g�G���h���r���h��...
call npm run build
if %errorlevel% neq 0 (
    echo �r���h�Ɏ��s���܂����B���~���܂��B
    exit /b %errorlevel%
)

:: 2. �t�@�C�����T�[�o�[�֓]�� (SCP)
echo [2/3] �T�[�o�[�փt�@�C����]����...
:: ����: ���t�@�C���̃p�X�͐�΃p�X���A���̃o�b�`�t�@�C������̑��΃p�X�Ŏw�肵�܂�
scp -i "documents\TCG_key.pem" -r ./dist/* ec2-user@54.174.151.132:/var/www/html/

:: 3. �����̕ύX (SSH�o�R�ŃR�}���h���s)
echo [3/3] �T�[�o�[�̌������C����...
ssh -i "documents\TCG_key.pem" ec2-user@54.174.151.132 "sudo chmod -R 755 /var/www/html/assets"

echo ==========================================
echo �f�v���C�������܂����I
echo ==========================================