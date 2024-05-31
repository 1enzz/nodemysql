const {
    createPool
} = require('mysql2/promise');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const port = 3000; // Escolha a porta que deseja usar para o servidor
app.use(bodyParser.json());
app.use(cors());

const pool = createPool({
    host: "localhost",
    user: "adm",
    password:"NvEn$$01%",
    database: "bdclimup",
    connectionLimit: 10,
    insecureAuth: true
});

//login empresa
app.post('/api/loginEmpresa', async (req, res) => {
    const { cnpjEmpresa, senhaEmpresa } = req.body;
    try {
        const [result] = await pool.query('SELECT idEmpresa, nomeEmpresa, senhaEmpresa FROM tbempresa where cnpjEmpresa = ?', [cnpjEmpresa]);
        if (result.length === 0) {
            return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });
        }
        const resquery = result[0];
        if (senhaEmpresa !== resquery.senhaEmpresa) {
            return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });
        }
        const id = resquery.idEmpresa;
        const nmEmpresa = resquery.nomeEmpresa;
        return res.status(200).json({ retorno: 'Login bem sucedido', nmEmpresa, id });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao fazer login' });
    }
});

app.post('/api/loginColaborador', async (req, res) => {
    const { email, senhaColaborador } = req.body;

    const chamaProc = 'CALL loginColaborador(?, ?, @resposta)';
    const pegaDadosProc = 'SELECT @resposta as resposta';

    try {
        // Chama a procedure
        await pool.query(chamaProc, [email, senhaColaborador]);

        // Executa a consulta para pegar o resultado da procedure
        const [rows] = await pool.query(pegaDadosProc);
        if(rows[0].resposta ==  '1'){
            return res.status(401).json({message:"Usuário ou senha incorretos", resposta: rows[0].resposta})
        }else if(rows[0].resposta ==  '2'){
            return res.status(200).json({message:"Atualizar senha", resposta: rows[0].resposta })
        }else if(rows[0].resposta ==  '3'){
            return res.status(401).json({message:"Usuário ou senha incorretos", resposta: rows[0].resposta})

        }else{
            return res.status(200).json({message:"Bem vindo",resposta: rows[0].resposta });
        }
        
    } catch (error) {
        console.log('Erro na execução', error);
        return res.status(500).json({ error: 'Erro ao executar a procedure ou o select' });
    }
});

app.post('/api/buscarQuestionarioDetalhado', async (req, res) => {
    const { idQuestionario, idColaborador } = req.body; // Remover idCategoria

    const chamaProc = 'CALL buscarQuestionarioDetalhado(?, ?)';

    try {
        // Chama a procedure
        const [results, fields] = await pool.query(chamaProc, [idQuestionario, idColaborador]);

        // Verifica se há resultados e retorna o primeiro conjunto de resultados
        if (results.length > 0) {
            return res.status(200).json(results[0]);
        } else {
            return res.status(404).json({ message: 'Nenhum dado encontrado' });
        }
    } catch (error) {
        console.log('Erro na execução', error);
        return res.status(500).json({ error: 'Erro ao executar a procedure' });
    }
});




// insert colaboradores
app.post('/api/colaboradores', async (req, res) => {
    const colaboradores = req.body;
    if (!Array.isArray(colaboradores) || colaboradores.length === 0) {
        return res.status(400).json({ message: 'Nenhum colaborador fornecido para inserção' });
    }
    const valores = colaboradores.map(colaborador => [colaborador.nomeColaborador, colaborador.cargoColaborador, colaborador.emailColaborador, colaborador.senhaColaboradorPadrao, colaborador.idadeColaborador, colaborador.sexoColaborador, colaborador.idEmpresa]);
    const query = 'INSERT INTO tbcolaborador (nomeColaborador, cargoColaborador, emailColaborador, senhaColaboradorPadrao, idadeColaborador, sexoColaborador, idEmpresa) VALUES ?';
    try {
        await pool.query(query, [valores]);
        return res.status(200).json({ message: 'Colaborador inserido com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao inserir colaborador' });
    }
});

//insert empresa
app.post('/api/empresa', async (req, res) => {
    const { nomeempresa, contatoempresa, emailempresa, senhaempresa, cnpjempresa } = req.body;
    const query = 'INSERT INTO tbempresa (nomeempresa, contatoempresa, emailempresa, senhaempresa, cnpjempresa) VALUES (?, ?, ?, ?, ?)';
    try {
        await pool.query(query, [nomeempresa, contatoempresa, emailempresa, senhaempresa, cnpjempresa]);
        return res.status(200).json({ message: 'Empresa cadastrada com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao inserir empresa' });
    }
});

//insert departamento
app.post('/api/departamento', async (req, res) => {
    const departamentos = req.body;
    if (!Array.isArray(departamentos) || departamentos.length === 0) {
        return res.status(400).json({ message: 'Nenhum departamento fornecido para inserção' });
    }
    const query = 'INSERT INTO tbdepartamento (nomeDepartamento, idEmpresa) VALUES ?';
    const values = departamentos.map(departamento => [departamento.nomeDepartamento, departamento.idEmpresa]);
    try {
        await pool.query(query, [values]);
        return res.status(200).json({ message: 'Departamentos cadastrados com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao inserir departamentos' });
    }
});

//insert cargo
app.post('/api/cadastraCargo', async (req, res) => {
    const cargos = req.body;
    if (!Array.isArray(cargos) || cargos.length === 0) {
        return res.status(400).json({ message: 'Nenhum cargo fornecido para inserção' });
    }
    const query = 'INSERT INTO tbcargo (nomeCargo, idDepartamento, idEmpresa) VALUES ?';
    const values = cargos.map(cargo => [cargo.nomeCargo, cargo.idDepartamento, cargo.idEmpresa]);
    try {
        await pool.query(query, [values]);
        return res.status(200).json({ message: 'Cargos cadastrados com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao inserir cargos' });
    }
});

//insert perguntas
app.post('/api/cadastraPerguntas', async (req, res) => {
    const perguntas = req.body;
    if (!Array.isArray(perguntas)) {
        return res.status(400).json({ message: 'Nenhuma pergunta fornecida para inserção' });
    }
    const query = 'INSERT INTO tbpergunta (dsPergunta, notaPergunta, idEmpresa, idCategoria) VALUES ?';
    const values = perguntas.map(pergunta => [pergunta.dsPergunta, pergunta.notaPergunta, pergunta.idEmpresa, pergunta.idCategoria]);
    try {
        await pool.query(query, [values]);
        return res.status(200).json({ message: 'Perguntas cadastradas com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao inserir perguntas' });
    }
});

//retorna cargos
app.post('/api/retornaCargos', async (req, res) => {
    const { idEmpresa } = req.body;
    try {
        const [result] = await pool.query(`
            SELECT idcargo as Id, 
                   c.nomecargo as Cargo, 
                   d.nomeDepartamento as Departamento 
            FROM tbcargo c 
            INNER JOIN tbdepartamento d on d.iddepartamento = c.iddepartamento
            WHERE c.idempresa = ?`, [idEmpresa]);
        res.status(200).json({ cargos: result, total: result.length });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao trazer cargos' });
    }
});

//retorna departamentos
app.post('/api/retornaDepartamentos', async (req, res) => {
    const { idEmpresa } = req.body;
    try {
        const [result] = await pool.query(`
            SELECT d.idDepartamento as Id, 
                   d.nomeDepartamento as Departamento, 
                   c.nomecolaborador as Responsavel 
            FROM tbdepartamento d 
            LEFT JOIN tbcolaborador c ON c.idcolaborador = d.idcolaboradorresponsavel 
            WHERE d.idEmpresa = ?`, [idEmpresa]);
        res.status(200).json({ departamentos: result, total: result.length });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao trazer departamentos' });
    }
});

//retorna colaboradores
app.post('/api/retornaColaboradores', async (req, res) => {
    const { idEmpresa } = req.body;
    try {
        const [result] = await pool.query(`
            SELECT cl.idcolaborador as Id,
                   cl.nomecolaborador as Nome,
                   cg.nomeCargo as Cargo,
                   cl.emailcolaborador as Email,
                   cl.idadeColaborador as Idade
            FROM tbcolaborador cl 
            LEFT JOIN tbcargo cg on cg.idcargo = cl.cargocolaborador
            WHERE cl.idempresa = ? 
            ORDER BY 1 DESC`, [idEmpresa]);
        res.status(200).json({ colaboradores: result });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao trazer colaboradores' });
    }
});

//retorna parametros telas
app.post('/api/retornaParametrosTelas', async (req, res) => {
    const { idEmpresa } = req.body;
    try {
        const [result] = await pool.query(`
            SELECT (SELECT count(d.iddepartamento) FROM tbdepartamento d WHERE d.idempresa = e.idempresa) as quantd,
                   (SELECT count(cg.idcargo) FROM tbcargo cg WHERE cg.idempresa = e.idempresa) as quantcg, 
                   (SELECT count(cl.idcolaborador) FROM tbcolaborador cl WHERE cl.idempresa = e.idempresa) as quantcl,
                   (SELECT count(pg.idpergunta) FROM tbpergunta pg WHERE pg.idempresa = e.idempresa) as quantpg 
            FROM tbempresa e 
            WHERE e.idempresa = ?`, [idEmpresa]);
        res.status(200).json({ retorno: result[0] });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar empresas' });
    }
});

//retorna departamento select
app.post('/api/retornaDepartamentoSelect', async (req, res) => {
    const { idEmpresa } = req.body;
    try {
        const [result] = await pool.query(`
            SELECT idDepartamento as Id, nomeDepartamento as Departamento 
            FROM tbdepartamento 
            WHERE idempresa = ?`, [idEmpresa]);
        res.status(200).json({ retorno: result });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar departamentos' });
    }
});

//retorna cargo select
app.post('/api/retornaCargoSelect', async (req, res) => {
    const { idEmpresa } = req.body;
    try {
        const [result] = await pool.query(`
            SELECT idcargo as Id, 
                   c.nomecargo as Cargo 
            FROM tbcargo c 
            WHERE c.idempresa = ?`, [idEmpresa]);
        res.status(200).json({ cargos: result });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar cargos' });
    }
});

//retorna categoria select
app.get('/api/retornaCategoriaSelect', async (req, res) => {
    try {
        const [result] = await pool.query(`
            SELECT idCategoria as Id, 
                   nomeCategoria as Categoria 
            FROM tbcategoria c`);
        res.status(200).json({ categorias: result });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar categorias' });
    }
});

//retorna perguntas
app.post('/api/retornaPerguntas', async (req, res) => {
    const { idEmpresa } = req.body;
    try {
        const [result] = await pool.query(`
            SELECT p.idPergunta as Id,
                   p.dsPergunta as Pergunta,
                   c.nomeCategoria as Categoria
            FROM tbpergunta p 
            INNER JOIN tbcategoria c on c.idcategoria = p.idcategoria
            WHERE p.idempresa = ? 
            ORDER BY 1 DESC`, [idEmpresa]);
        res.status(200).json({ perguntas: result });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar perguntas' });
    }
});

//retorna perguntas por categoria
app.post('/api/retornaPerguntasCategoria', async (req, res) => {
    const { idEmpresa, idCategoria } = req.body;
    try {
        const [result] = await pool.query(`
            SELECT idPergunta as Id,
                   dsPergunta as Pergunta
            FROM tbpergunta 
            WHERE idempresa = ? 
              AND idcategoria = ?`, [idEmpresa, idCategoria]);
        res.status(200).json({ perguntas: result });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar perguntas por categoria' });
    }
});

//cadastra questionario
app.post('/api/cadastraQuestionario', async (req, res) => {
    const { nomeQuestionario, idEmpresa, idCategoria, idPergunta1, idPergunta2, idPergunta3, idPergunta4, idPergunta5 } = req.body;
    const query = `
        INSERT INTO tbquestionario (nomeQuestionario, idEmpresa, idCategoria, idPergunta1, idPergunta2, idPergunta3, idPergunta4, idPergunta5) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        await pool.query(query, [nomeQuestionario, idEmpresa, idCategoria, idPergunta1, idPergunta2, idPergunta3, idPergunta4, idPergunta5]);
        return res.status(200).json({ message: 'Questionário cadastrado com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao cadastrar questionário' });
    }
});

//retorna questionarios
app.post('/api/retornaQuestionarios', async (req, res) => {
    const { idEmpresa } = req.body;
    try {
        const [result] = await pool.query(`
            SELECT idQuestionario as Id,
                   nomeQuestionario as Nome,
                   c.nomeCategoria as Categoria
            FROM tbquestionario q 
            INNER JOIN tbcategoria c on c.idcategoria = q.idcategoria
            WHERE idempresa = ?`, [idEmpresa]);
        res.status(200).json({ questionarios: result });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar questionários' });
    }
});

app.put('/api/alteraSenha', async (req, res) =>{
    const { email, senhaColaboradorAtual } = req.body;

    const chamaProc = 'CALL alteraSenha(?, ?, @resposta)';
    const pegaDadosProc = 'SELECT @resposta as resposta';

    try {
        // Chama a procedure
        await pool.query(chamaProc, [email, senhaColaboradorAtual]);

        // Executa a consulta para pegar o resultado da procedure
        const [rows] = await pool.query(pegaDadosProc);
        if(rows[0].resposta ==  '0'){
            return res.status(401).json({message:"Email incorreto", resposta: rows[0].resposta})
        }else if(rows[0].resposta ==  '1'){
            return res.status(200).json({message:"Senha alterada!" })
        }else{
            return res.status(500).json({message:"Erro Sinistro" })
        }
        
    } catch (error) {
        console.log('Erro na execução', error);
        return res.status(500).json({ error: 'Erro ao executar a procedure ou o select' });
    }
})

app.post('/api/buscarAvaliados', async (req,res) =>{
    const{idColaborador} = req.body;

    try{
        const [rows] = await pool.query(`SELECT cb.idcolaborador, cb.nomecolaborador 
        FROM tbdepartamento d 
        INNER JOIN tbcargo c ON c.iddepartamento = d.iddepartamento
        INNER JOIN tbcolaborador cb ON cb.cargoColaborador = c.idcargo
        WHERE cb.idcolaborador <> ?;`, [idColaborador]);

        // Enviar a resposta com os dados
        return res.status(200).json(rows);
    } catch (err) {
        console.log('Erro ao executar a consulta:', err);
        return res.status(500).json({ error: 'Erro ao executar a consulta' });
    }
})


app.post('/api/enviarResposta', async (req, res) => {
    const {
        idQuestionario,
        idColaboradorAvaliando,
        idColaboradorAvaliado,
        notaPergunta1,
        notaPergunta2,
        notaPergunta3,
        notaPergunta4,
        notaPergunta5,
        comentario,
        idCategoria
    } = req.body;

    const chamaProc = 'CALL inserirResposta(?, ?, ?, ?, ?, ?, ?, ?, ?,?)';

    try {
        // Chama a procedure para inserir os dados
        const result = await pool.query(chamaProc, [
            idQuestionario,
            idColaboradorAvaliando,
            idColaboradorAvaliado,
            notaPergunta1,
            notaPergunta2,
            notaPergunta3,
            notaPergunta4,
            notaPergunta5,
            comentario,
            idCategoria
        ]);

        return res.status(200).json({ message: 'Resposta enviada com sucesso', result });
    } catch (error) {
        console.log('Erro na execução', error);
        return res.status(500).json({ error: 'Erro ao executar a procedure' });
    }
});




app.listen(port, () => {
    console.log(`Servidor Node.js está executando na porta ${port}`);
});
