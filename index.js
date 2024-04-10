const {
    createPool
} = require('mysql');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; // Escolha a porta que deseja usar para o servidor
app.use(bodyParser.json());


const pool = createPool({
    host: "localhost",
    user: "adm",
    password:"NvEn$$01%",
    database: "bdclimup",
    connectionLimit: 10,
    insecureAuth: true
})

//select colaboradores
app.get('/api/colaboradores', (req, res) => {
    pool.query('SELECT * FROM tbcolaborador', (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar colaboradores' });
        }
        return res.status(200).json(results);
    });
});

//select empresas
app.get('/api/empresa',(req,res) =>{
    pool.query('select * from tbempresa', (error, results) =>{
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar empresas' });
        }
        return res.status(200).json(results);
    });
})

// insert colaboradores
app.post('/api/colaboradores', (req, res) => {
    const { nomecolaborador, cargocolaborador, emailcolaborador, idempresa } = req.body;
    if(!nomecolaborador || !idempresa){
        return res.status(500).json({ message: 'Não é possível registrar o colaborador sem que seu nome ou a empresa a qual pertence, estejam preenchidos' });
    }
    const query = 'INSERT INTO tbcolaborador (nomecolaborador, cargocolaborador, emailcolaborador, idEmpresa) VALUES (?, ?, ?, ?)';
    pool.query(query, [nomecolaborador, cargocolaborador, emailcolaborador, idempresa], (error, results, fields) => {
        
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao inserir colaborador' });
        }
        return res.status(200).json({ message: 'Colaborador inserido com sucesso' });
    });
});

//insert empresa
app.post('/api/empresa', (req, res) => {
    const { nomeempresa, contatoempresa, emailempresa, senhaempresa } = req.body;
    if(!nomeempresa){
        return res.status(500).json({ message: 'Não é possível registrar o a empresa sem que seu nome esteja preenchido' });
    }
    const query = 'INSERT INTO tbempresa (nomeempresa, contatoempresa, emailempresa, senhaempresa) VALUES (?, ?, ?, ?)';
    pool.query(query, [nomeempresa, contatoempresa, emailempresa, senhaempresa], (error, results, fields) => {
        
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao inserir colaborador' });
        }
        return res.status(200).json({ message: 'Empresa cadastrada com sucesso' });
    });
});

app.listen(port, () => {
    console.log(`Servidor Node.js está executando na porta ${port}`);
});


 